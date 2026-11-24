/**
 * 1. Purpose: Pipeline 1B endpoint ingesting user files/notes context and extracting a structured starting brief.
 * 2. Spec Ref: Prompt Catalog v2.5 Section 7 Pipeline 1B (Prompt #16) & Screen 10a/10b/14.
 * 3. Called By: Onboarding wizard for file/notes context path.
 * 4. Calls: createClient, createAdminClient, guardApiRoute, getSystemSettings, processOnboardingFile, checkAIFirewall, executeAIPipeline.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/db/server';
import { createAdminClient } from '@/lib/db/admin';
import { checkAIFirewall } from '@/lib/ai/firewall';
import { executeAIPipeline } from '@/lib/ai/assembler';
import { processOnboardingFile, type ExtractedContextFile, type InlineMediaPart } from '@/lib/ai/file-extractor';
import { formatAIFirewallHttpError, guardApiRoute } from '@/lib/services/access-guard.service';
import { getSystemSettings } from '@/lib/services/system-settings.service';
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

function isUploadedFile(entry: FormDataEntryValue): entry is File {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    'name' in entry &&
    'size' in entry &&
    typeof (entry as File).arrayBuffer === 'function' &&
    (entry as File).size > 0
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const guard = await guardApiRoute(user.id);
  if (!guard.ok) return guard.response;

  const admin = createAdminClient();
  const [{ data: profile }, settings, { data: categories }] = await Promise.all([
    admin.from('users').select('language, country, birth_year, person_memory_json').eq('id', user.id).single(),
    getSystemSettings({ fresh: true }),
    admin.from('goal_categories').select('slug').eq('is_active', true),
  ]);

  const maxFiles = settings.onboarding_context_max_files;
  const maxFileSizeBytes = settings.onboarding_context_max_file_size_bytes;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'INVALID_FORM_DATA', message: 'Expected multipart/form-data' }, { status: 400 });
  }

  const uploadedFiles = [...formData.getAll('files'), ...formData.getAll('file')].filter(isUploadedFile);
  if (uploadedFiles.length > maxFiles) {
    return NextResponse.json(
      {
        error: 'TOO_MANY_FILES',
        message: `You can upload at most ${maxFiles} ${maxFiles === 1 ? 'file' : 'files'}.`,
      },
      { status: 400 }
    );
  }

  const pastedText = (formData.get('pastedText') as string | null)?.trim() || '';
  const outlineModeRaw = formData.get('outlineMode') as string | null;
  const outlineMode: OutlineMode = outlineModeRaw === 'FOLLOW_OUTLINE' ? 'FOLLOW_OUTLINE' : 'BACKGROUND_CONTEXT';
  const deadlineDate = (formData.get('deadlineDate') as string | null)?.trim() || '';
  const workingDays = parseWorkingDays(formData.get('workingDays'));
  const rawHours = formData.get('hoursPerDay');
  const hoursPerDay = Math.max(0.5, Math.min(8.0, Number(rawHours) || 2.0));

  const extractedResults: ExtractedContextFile[] = [];
  for (const uploadedFile of uploadedFiles) {
    try {
      const extracted = await processOnboardingFile(uploadedFile, { maxFiles, maxFileSizeBytes });
      extractedResults.push(extracted);
    } catch (err) {
      const errCode = err instanceof Error ? err.message : 'EXTRACTION_FAILED';
      const maxMb = (maxFileSizeBytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '');
      const message =
        errCode === 'FILE_TOO_LARGE'
          ? `File "${uploadedFile.name}" exceeds the ${maxMb} MB limit.`
          : errCode === 'UNSUPPORTED_FILE_TYPE'
            ? `Unsupported file type for "${uploadedFile.name}".`
            : errCode;
      return NextResponse.json({ error: errCode, message }, { status: 400 });
    }
  }

  const textParts: string[] = [];
  if (pastedText) textParts.push(pastedText.slice(0, 8000));
  for (const res of extractedResults) {
    if (res.extractedText) {
      textParts.push(
        extractedResults.length > 1
          ? `[File: ${res.fileName}]\n${res.extractedText}`
          : res.extractedText
      );
    }
  }
  let textForPrompt = textParts.join('\n\n---\n\n').slice(0, 12000);

  const inlineParts = extractedResults
    .map((r) => r.inlinePart)
    .filter((p): p is InlineMediaPart => Boolean(p));

  if (!textForPrompt && inlineParts.length > 0) {
    const names = extractedResults.map((r) => r.fileName).join(', ');
    textForPrompt = `[Attached visual or document context: ${names}]`;
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
    const err = formatAIFirewallHttpError(firewall.reason, firewall.retryAfterSeconds);
    return NextResponse.json(err.body, { status: err.status });
  }

  let totalWeeks = 12;
  if (deadlineDate) {
    const diffDays = Math.ceil((new Date(deadlineDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    totalWeeks = Math.max(1, Math.min(52, Math.ceil(diffDays / 7)));
  }

  const activeCategoriesList = (categories || []).map((c) => c.slug);

  try {
    const output = await executeAIPipeline<Pipeline1BOutput>(
      {
        pipeline: 'PIPELINE_1B',
        userId: user.id,
        model: firewall.model,
        language: (profile?.language as 'EN' | 'BN') || 'EN',
        country: profile?.country || 'BD',
        inlineParts: inlineParts.length > 0 ? inlineParts : undefined,
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
