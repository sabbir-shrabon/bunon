/**
 * 1. Purpose: Pipeline 2 API endpoint for generating 4-8 milestone roadmaps with Plan A/B support.
 * 2. Spec Ref: Prompt Catalog v2.5 Section 7 Pipeline 2 & Screen 17/19.
 * 3. Called By: Onboarding wizard for roadmap generation and regeneration.
 * 4. Calls: Server Supabase client, AI Firewall, Assembler, and context-pack.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/db/server';
import { createAdminClient } from '@/lib/db/admin';
import { checkAIFirewall } from '@/lib/ai/firewall';
import { executeAIPipeline } from '@/lib/ai/assembler';
import { buildContextPack } from '@/lib/ai/context-pack';
import { formatAIFirewallHttpError, guardApiRoute } from '@/lib/services/access-guard.service';
import { Pipeline2RoadmapGeneratorSchema } from '@/types/ai-schemas';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const guard = await guardApiRoute(user.id);
  if (!guard.ok) return guard.response;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('users')
    .select('language, country, person_memory_json')
    .eq('id', user.id)
    .single();

  const body = (await request.json()) as {
    goalTitle: string;
    goalWhy: string;
    goalCategory: string;
    executionMode: 'deliverable_queue' | 'daily_quota';
    planStyle: 'FLEXIBLE_WEEK' | 'DAILY_ADAPTIVE';
    outlineMode?: 'FOLLOW_OUTLINE' | 'BACKGROUND_CONTEXT';
    outline_mode?: 'FOLLOW_OUTLINE' | 'BACKGROUND_CONTEXT';
    extractedOutlineSummary?: string;
    extracted_outline_summary?: string;
    deadlineDate: string;
    totalWeeks: number;
    workingDays: number[];
    hoursPerDay: number;
    currentBaseline: string;
    constraints?: string;
    followupQa?: Array<{ question: string; answer: string }>;
    regenerationFeedbackReason?: string;
    goalId?: string | null;
  };

  const isRegeneration = Boolean(body.regenerationFeedbackReason);

  const firewall = await checkAIFirewall({
    userId: user.id,
    userIp: request.headers.get('x-forwarded-for'),
    pipeline: 'PIPELINE_2',
    goalId: body.goalId,
    inputs: {
      goalTitle: body.goalTitle,
      goalWhy: body.goalWhy,
      answers: [body.currentBaseline, body.constraints || ''],
    },
    isRetry: isRegeneration,
  });

  if (!firewall.allowed) {
    const err = formatAIFirewallHttpError(firewall.reason, firewall.retryAfterSeconds);
    return NextResponse.json(err.body, { status: err.status });
  }

  const contextPack = buildContextPack(
    profile?.person_memory_json,
    {},
    body.goalCategory,
    15
  );

  const availableHoursTotal = Math.round(
    body.totalWeeks * body.workingDays.length * body.hoursPerDay
  );

  try {
    const output = await executeAIPipeline(
      {
        pipeline: 'PIPELINE_2',
        userId: user.id,
        goalId: body.goalId ?? null,
        model: firewall.model,
        language: (profile?.language as 'EN' | 'BN') || 'EN',
        country: profile?.country || 'BD',
        category: body.goalCategory,
        variables: {
          goal_title: firewall.sanitizedInputs?.goalTitle || body.goalTitle,
          goal_why: firewall.sanitizedInputs?.goalWhy || body.goalWhy,
          goal_category: body.goalCategory,
          execution_mode: body.executionMode,
          plan_style: body.planStyle,
          outline_mode: body.outlineMode || body.outline_mode || 'BACKGROUND_CONTEXT',
          extracted_outline_summary: body.extractedOutlineSummary || body.extracted_outline_summary || '',
          deadline_date: body.deadlineDate,
          total_weeks: body.totalWeeks,
          working_days: body.workingDays.join(','),
          hours_per_day: body.hoursPerDay,
          available_hours_total: availableHoursTotal,
          current_baseline: body.currentBaseline,
          constraints: body.constraints || 'None stated',
          context_pack_json: contextPack,
          followup_qa_json: body.followupQa || [],
          regeneration_feedback_reason: body.regenerationFeedbackReason || 'Initial plan generation',
        },
      },
      Pipeline2RoadmapGeneratorSchema
    );

    return NextResponse.json({
      ...output,
      available_hours_total: availableHoursTotal,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI call failed';
    return NextResponse.json({ error: 'AI_PIPELINE_FAILED', details: msg }, { status: 502 });
  }
}
