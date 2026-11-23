/**
 * 1. Purpose: Pipeline 1 API endpoint for category detection, safety checking, and follow-ups.
 * 2. Spec Ref: Prompt Catalog v2.5 Section 7 Pipeline 1 & Screen 14/15/16.
 * 3. Called By: Onboarding wizard after Q1-Q5.
 * 4. Calls: Server Supabase client, AI Firewall, and Assembler.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/db/server';
import { createAdminClient } from '@/lib/db/admin';
import { checkAIFirewall } from '@/lib/ai/firewall';
import { executeAIPipeline } from '@/lib/ai/assembler';
import { Pipeline1OnboardingFollowupsSchema } from '@/types/ai-schemas';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Enforce Free plan (1 active goal) and Pro plan (3 active goals) limit
  const { data: profile } = await admin
    .from('users')
    .select('pro_until, language, country, birth_year, person_memory_json')
    .eq('id', user.id)
    .single();

  const isPro = Boolean(profile?.pro_until && new Date(profile.pro_until) > new Date());
  const maxActiveGoals = isPro ? 3 : 1;

  const { count: activeGoalsCount } = await admin
    .from('goals')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE');

  if ((activeGoalsCount || 0) >= maxActiveGoals) {
    return NextResponse.json(
      {
        error: 'GOAL_LIMIT_REACHED',
        message: isPro
          ? 'You have 3 active goals. Finish or pause one first.'
          : 'Free plan includes 1 active goal. Upgrade to Pro for more.',
      },
      { status: 403 }
    );
  }

  const body = (await request.json()) as {
    goalTitle: string;
    goalWhy: string;
    deadlineDate: string;
    totalWeeks: number;
    workingDays: number[];
    hoursPerDay: number;
    currentBaseline: string;
    constraints?: string;
  };

  // Run Gate 1-4 AI Firewall
  const firewall = await checkAIFirewall({
    userId: user.id,
    userIp: request.headers.get('x-forwarded-for'),
    pipeline: 'PIPELINE_1',
    inputs: {
      goalTitle: body.goalTitle,
      goalWhy: body.goalWhy,
      answers: [body.currentBaseline, body.constraints || ''],
    },
  });

  if (!firewall.allowed) {
    if (firewall.reason === 'RATE_LIMITED') {
      return NextResponse.json(
        { error: 'RATE_LIMITED', retry_after_seconds: firewall.retryAfterSeconds },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: firewall.reason }, { status: 403 });
  }

  // Fetch active categories to construct {{active_categories_list}}
  const { data: categories } = await admin
    .from('goal_categories')
    .select('slug, label_en, detection_hint')
    .eq('is_active', true);

  const activeCategoriesList = (categories || [])
    .map((c) => `• ${c.slug}: ${c.detection_hint}`)
    .join('\n');

  try {
    const output = await executeAIPipeline(
      {
        pipeline: 'PIPELINE_1',
        userId: user.id,
        model: firewall.model,
        language: (profile?.language as 'EN' | 'BN') || 'EN',
        country: profile?.country || 'BD',
        variables: {
          user_birth_year: profile?.birth_year || 1998,
          goal_title: firewall.sanitizedInputs?.goalTitle || body.goalTitle,
          goal_why: firewall.sanitizedInputs?.goalWhy || body.goalWhy,
          deadline_date: body.deadlineDate,
          total_weeks: body.totalWeeks,
          working_days: body.workingDays.join(','),
          hours_per_day: body.hoursPerDay,
          current_baseline: body.currentBaseline,
          constraints: body.constraints || 'None stated',
          person_memory_json: profile?.person_memory_json || {},
          active_categories_list: activeCategoriesList,
        },
      },
      Pipeline1OnboardingFollowupsSchema
    );

    return NextResponse.json(output);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI call failed';
    return NextResponse.json({ error: 'AI_PIPELINE_FAILED', details: msg }, { status: 502 });
  }
}
