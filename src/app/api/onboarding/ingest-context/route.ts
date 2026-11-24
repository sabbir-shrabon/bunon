/**
 * 1. Purpose: Pipeline 1B endpoint ingesting user files/notes context and extracting a structured starting brief.
 * 2. Spec Ref: Prompt Catalog v2.5 Section 7 Pipeline 1B (Prompt #16) & Screen 10a/10b/14.
 * 3. Called By: Onboarding wizard for file/notes context path.
 * 4. Calls: createClient, createAdminClient, processOnboardingFile, checkAIFirewall, executeAIPipeline.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/db/server';
import { createAdminClient } from '@/lib/db/admin';
import { checkAIFirewall } from '@/lib/ai/firewall';
import { executeAIPipeline } from '@/lib/ai/assembler';
import { processOnboardingFile, type ExtractedContextFile } from '@/lib/ai/file-extractor';
import { Pipeline1BOutputSchema, type Pipeline1BOutput } from '@/types/ai-schemas';
import type { OutlineMode } from '@/types/domain';

export const maxDuration = 60;

function parseWorkingDays(val: FormDataEntryValue | null): number[] {
  if (!val) return [0, 1, 2, 3, 4];
  const str = String(val).trim();
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) {
      return parsed.map((n) => Number(n)).filter((n) => !isNaN(n));
    }
  } catch {
    // Treat as comma separated
  }
  const split = str.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
  return split.length > 0 ? split : [0, 1, 2, 3, 4];
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const [{ data: profile }, { data: settings }, { data: categories }] = await Promise.all([
    admin.from('users').select('language, country, birth_year, person_memory_json').eq('id', user.id).single(),
    admin.from('system_settings').select('onboarding_context_max_files, onboarding_context_max_file_size_bytes').eq('id', 1).single(),
    admin.from('goal_categories').select('slug').eq('is_active', true),
  ]);

  const maxFiles = Number(settings?.onboarding_context_max_files) || 1;
  const maxFileSizeBytes = Number(settings?.onboarding_context_max_file_size_bytes) || 5242880;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'INVALID_FORM_DATA', message: 'Expected multipart/form-data' }, { status: 400 });
  }

  const file = formData.get('file');
  const pastedText = (formData.get('pastedText') as string | null)?.trim() || '';
  const outlineModeRaw = formData.get('outlineMode') as string | null;
  const outlineMode: OutlineMode = outlineModeRaw === 'FOLLOW_OUTLINE' ? 'FOLLOW_OUTLINE' : 'BACKGROUND_CONTEXT';
  const deadlineDate = (formData.get('deadlineDate') as string | null)?.trim() || '';
  const workingDays = parseWorkingDays(formData.get('workingDays'));
  const rawHours = formData.get('hoursPerDay');
  const hoursPerDay = Math.max(0.5, Math.min(8.0, Number(rawHours) || 2.0));

  let extractedResult: ExtractedContextFile | null = null;
  if (file && typeof file === 'object' && 'name' in file && 'size' in file && (file as File).size > 0) {
    try {
      extractedResult = await processOnboardingFile(file as File, { maxFiles, maxFileSizeBytes });
    } catch (err) {
      const errCode = err instanceof Error ? err.message : 'EXTRACTION_FAILED';
      return NextResponse.json({ error: errCode }, { status: 400 });
    }
  }

  const textParts: string[] = [];
  if (pastedText) textParts.push(pastedText.slice(0, 8000));
  if (extractedResult?.extractedText) textParts.push(extractedResult.extractedText);
  let textForPrompt = textParts.join('\n\n---\n\n').slice(0, 12000);

  if (!textForPrompt && extractedResult?.inlinePart) {
    textForPrompt = `[Attached visual or document context: ${extractedResult.fileName}]`;
  }

  if (!textForPrompt) {
    return NextResponse.json(
      { error: 'NO_CONTEXT_PROVIDED', message: 'Please provide either a context file or pasted notes.' },
      { status: 400 }
    );
  }

  const firewall = await checkAIFirewall({
    userId: user.id,
    userIp: request.headers.get('x-forwarded-for'),
    pipeline: 'PIPELINE_1B',
    inputs: { pastedText: textForPrompt.slice(0, 8000) },
  });

  if (!firewall.allowed) {
    if (firewall.reason === 'RATE_LIMITED') {
      return NextResponse.json({ error: 'RATE_LIMITED', retry_after_seconds: firewall.retryAfterSeconds }, { status: 429 });
    }
    return NextResponse.json({ error: firewall.reason }, { status: 403 });
  }

  let totalWeeks = 12;
  if (deadlineDate) {
    const diffDays = Math.ceil((new Date(deadlineDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    totalWeeks = Math.max(1, Math.min(52, Math.ceil(diffDays / 7)));
  }

  const activeCategoriesList = (categories || []).map((c) => c.slug);
  const inlineParts = extractedResult?.inlinePart ? [extractedResult.inlinePart] : undefined;

  try {
    const output = await executeAIPipeline<Pipeline1BOutput>(
      {
        pipeline: 'PIPELINE_1B',
        userId: user.id,
        model: firewall.model,
        language: (profile?.language as 'EN' | 'BN') || 'EN',
        country: profile?.country || 'BD',
        inlineParts,
        variables: {
          language: (profile?.language as 'EN' | 'BN') || 'EN',
          user_birth_year: profile?.birth_year || 1998,
          user_country: profile?.country || 'BD',
          outline_mode: outlineMode,
          deadline_date: deadlineDate || new Date(Date.now() + 84 * 86400000).toISOString().slice(0, 10),
          total_weeks: totalWeeks,
          working_days: workingDays.join(','),
          hours_per_day: hoursPerDay,
          pasted_or_extracted_text: textForPrompt,
          person_memory_json: profile?.person_memory_json || {},
          active_categories_list: activeCategoriesList,
        },
      },
      Pipeline1BOutputSchema
    );

    return NextResponse.json({
      ...output,
      active_outline_mode: outlineMode,
      max_file_size_bytes: maxFileSizeBytes,
      max_files: maxFiles,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Context ingestion failed';
    return NextResponse.json({ error: 'AI_PIPELINE_FAILED', details: msg }, { status: 502 });
  }
}
