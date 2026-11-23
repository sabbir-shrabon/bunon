import { NextResponse, type NextRequest } from 'next/server';
/**
 * 1. Purpose: Pipeline 3 API endpoint for locking the roadmap and generating Week 1 tasks.
 * 2. Spec Ref: Prompt Catalog v2.5 Section 7 Pipeline 3 & Screen 20/22.
 * 3. Called By: Screen 20 "Build Week 1 & start Day 1".
 * 4. Calls: Server Supabase client, AI Firewall, Assembler, and context-pack.
 */

import { z } from 'zod';
import { createClient } from '@/lib/db/server';
import { createAdminClient } from '@/lib/db/admin';
import { checkAIFirewall } from '@/lib/ai/firewall';
import { executeAIPipeline } from '@/lib/ai/assembler';
import { buildContextPack } from '@/lib/ai/context-pack';
import { Pipeline3WeeklyPlannerSchema, type Pipeline3Output } from '@/types/ai-schemas';
import type { DayTimeMap } from '@/types/domain';

function normalizeReminderTime(val?: string | null): string | undefined {
  if (!val) return undefined;
  const trimmed = val.trim();
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    const h = match24[1].padStart(2, '0');
    const m = match24[2];
    const s = match24[3] || '00';
    return `${h}:${m}:${s}`;
  }
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2];
    const modifier = match12[3].toUpperCase();
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
  }
  return trimmed;
}

function parseWorkingDays(val: unknown): number[] {
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'number') return item;
        if (typeof item === 'string') {
          const n = parseInt(item, 10);
          return isNaN(n) ? null : n;
        }
        if (typeof item === 'object' && item !== null && 'index' in item) {
          const n = Number((item as { index: unknown }).index);
          return isNaN(n) ? null : n;
        }
        return null;
      })
      .filter((n): n is number => n !== null);
  }
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  }
  return [];
}

const MilestoneInputSchema = z.object({
  position: z.preprocess((v) => {
    const n = Number(v);
    return isNaN(n) || n < 1 ? 1 : Math.round(n);
  }, z.number().int().min(1).default(1)),
  title: z.preprocess((v) => {
    return typeof v === 'string' ? v.trim() : String(v || '').trim();
  }, z.string().min(1, 'Milestone title is required')),
  expected_result: z.preprocess((v) => {
    return typeof v === 'string' ? v.trim() : String(v || '').trim();
  }, z.string().default('')),
  estimated_hours: z.preprocess((v) => {
    const n = Number(v);
    return isNaN(n) || n <= 0 ? 10 : n;
  }, z.number().positive().default(10)),
  target_metric_value: z.preprocess((v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }, z.number().nullable().optional().default(null)),
  target_metric_unit: z.preprocess((v) => {
    if (v === null || v === undefined || v === '') return null;
    return String(v).trim();
  }, z.string().nullable().optional().default(null)),
});

const LockAndPlanRequestSchema = z.object({
  goalTitle: z.string().optional(),
  goal_title: z.string().optional(),
  goalWhy: z.string().optional(),
  goal_why: z.string().optional(),
  goalCategory: z.string().optional(),
  goal_category: z.string().optional(),
  category: z.string().optional(),
  executionMode: z.enum(['deliverable_queue', 'daily_quota']).optional(),
  execution_mode: z.enum(['deliverable_queue', 'daily_quota']).optional(),
  planStyle: z.enum(['FLEXIBLE_WEEK', 'DAILY_ADAPTIVE']).optional(),
  plan_style: z.enum(['FLEXIBLE_WEEK', 'DAILY_ADAPTIVE']).optional(),
  deadlineDate: z.string().optional(),
  deadline_date: z.string().optional(),
  deadline: z.string().optional(),
  totalWeeks: z.coerce.number().int().positive().optional(),
  total_weeks: z.coerce.number().int().positive().optional(),
  hoursPerDay: z.coerce.number().positive().optional(),
  hours_per_day: z.coerce.number().positive().optional(),
  workingDays: z.preprocess((val) => parseWorkingDays(val), z.array(z.number()).optional()),
  working_days: z.preprocess((val) => parseWorkingDays(val), z.array(z.number()).optional()),
  currentBaseline: z.preprocess((v) => (v === null || v === undefined ? '' : String(v)), z.string().default('')),
  current_baseline: z.preprocess((v) => (v === null || v === undefined ? '' : String(v)), z.string().default('')),
  constraints: z.preprocess((v) => (v === null || v === undefined ? '' : String(v)), z.string().default('')),
  milestones: z.array(MilestoneInputSchema).min(1, 'At least one milestone is required in roadmap'),
  used_context_ids: z.array(z.string()).optional().default([]),
  boosters: z.array(z.string()).optional().default([]),
  reminderTime: z.string().optional(),
  reminder_time: z.string().optional(),
  previousRoadmapJson: z.unknown().optional(),
  previous_roadmap_json: z.unknown().optional(),
  day_time_map: z.unknown().optional(),
  day_time_map_json: z.unknown().optional(),
  dayTimeMap: z.unknown().optional(),
  followupAnswers: z.unknown().optional(),
  followup_qa: z.unknown().optional(),
  followupQa: z.unknown().optional(),
  onboarding_answers: z.unknown().optional(),
  onboardingAnswers: z.unknown().optional(),
}).superRefine((data, ctx) => {
  const title = (data.goalTitle || data.goal_title || '').trim();
  if (!title) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Goal title is required',
      path: ['goalTitle'],
    });
  }

  const why = (data.goalWhy || data.goal_why || '').trim();
  if (!why) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Goal why is required',
      path: ['goalWhy'],
    });
  }

  const deadline = (data.deadlineDate || data.deadline_date || data.deadline || '').trim();
  if (!deadline) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Deadline date is required',
      path: ['deadlineDate'],
    });
  }

  const days = (data.workingDays && data.workingDays.length > 0)
    ? data.workingDays
    : (data.working_days && data.working_days.length > 0)
      ? data.working_days
      : [];

  if (days.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one working day is required',
      path: ['workingDays'],
    });
  }
});

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let rawJson: unknown;
  try {
    rawJson = await request.json();
  } catch {
    console.error('[lock-and-plan 400] Malformed JSON payload');
    return NextResponse.json({ error: 'INVALID_JSON', message: 'Malformed JSON payload' }, { status: 400 });
  }

  const parsed = LockAndPlanRequestSchema.safeParse(rawJson);
  if (!parsed.success) {
    console.error('[lock-and-plan 400]', parsed.error.flatten());
    return NextResponse.json({
      error: 'INVALID_REQUEST_BODY',
      message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
    }, { status: 400 });
  }

  const body = parsed.data;
  const admin = createAdminClient();

  // Clean up any lingering orphan goals (0 milestones or 0 tasks left over from earlier 500 crash)
  const { data: existingGoals } = await admin
    .from('goals')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE');

  for (const g of existingGoals || []) {
    const { count: mCount } = await admin.from('milestones').select('id', { count: 'exact', head: true }).eq('goal_id', g.id);
    const { count: tCount } = await admin.from('tasks').select('id', { count: 'exact', head: true }).eq('goal_id', g.id);
    if (!mCount || mCount === 0 || !tCount || tCount === 0) {
      console.warn('[lock-and-plan] Cleaning up orphan goal:', g.id);
      await admin.from('goals').delete().eq('id', g.id);
    }
  }

  // Enforce Free plan (1 active goal) and Pro plan (3 active goals) limit
  const { data: profile } = await admin.from('users').select('pro_until, language, country, person_memory_json, day_time_map_json').eq('id', user.id).single();
  const isPro = Boolean(profile?.pro_until && new Date(profile.pro_until) > new Date());
  const maxActiveGoals = isPro ? 3 : 1;
  const { count: activeCount } = await admin.from('goals').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'ACTIVE');

  if ((activeCount || 0) >= maxActiveGoals) {
    console.error('[lock-and-plan 400] GOAL_LIMIT_REACHED: active goals limit reached', { activeCount, maxActiveGoals, isPro });
    return NextResponse.json({
      error: 'GOAL_LIMIT_REACHED',
      message: isPro ? 'You have 3 active goals. Finish or pause one first.' : 'Free plan includes 1 active goal. Upgrade to Pro for more.',
    }, { status: 400 });
  }

  const resolvedGoalTitle = (body.goalTitle || body.goal_title || '').trim();
  const resolvedGoalWhy = (body.goalWhy || body.goal_why || '').trim();
  const resolvedCategory = body.goalCategory || body.goal_category || body.category || 'OTHER';
  const resolvedExecutionMode = body.executionMode || body.execution_mode || 'deliverable_queue';
  const resolvedPlanStyle = body.planStyle || body.plan_style || 'DAILY_ADAPTIVE';
  const resolvedDeadline = (body.deadlineDate || body.deadline_date || body.deadline || '').trim();
  const rawHoursPerDay = body.hoursPerDay || body.hours_per_day || 2.0;
  const resolvedHoursPerDay = Math.max(0.5, Math.min(8.0, Number(rawHoursPerDay)));
  const resolvedWorkingDays = (body.workingDays && body.workingDays.length > 0)
    ? body.workingDays
    : (body.working_days && body.working_days.length > 0)
      ? body.working_days
      : [0, 1, 2, 3, 4];
  const resolvedBaseline = (body.currentBaseline || body.current_baseline || '').trim();
  const resolvedConstraints = (body.constraints || '').trim();
  const resolvedTotalWeeks = body.totalWeeks || body.total_weeks || 12;
  const rawReminder = body.reminderTime || body.reminder_time;
  const resolvedReminder = normalizeReminderTime(rawReminder);
  const resolvedPreviousRoadmap = body.previousRoadmapJson ?? body.previous_roadmap_json ?? null;
  const resolvedDayTimeMap = (body.day_time_map || body.day_time_map_json || body.dayTimeMap) as DayTimeMap | undefined;

  if (resolvedReminder) {
    await admin.from('users').update({ reminder_time: resolvedReminder }).eq('id', user.id);
  }

  const journeyMemory = { version: 1, items: [], missing_context_boosters: body.boosters || [] };
  const defaultDayMap: DayTimeMap = {
    sat: { available_minutes: 60 }, sun: { available_minutes: 60 }, mon: { available_minutes: 60 },
    tue: { available_minutes: 60 }, wed: { available_minutes: 60 }, thu: { available_minutes: 60 }, fri: { available_minutes: 60 },
  };

  let createdGoalId: string | null = null;
  try {
    // 1. Insert Goal row
    const { data: goal, error: goalError } = await admin.from('goals').insert({
      user_id: user.id,
      title: resolvedGoalTitle.slice(0, 150),
      why: resolvedGoalWhy.slice(0, 350),
      category: resolvedCategory,
      execution_mode: resolvedExecutionMode,
      plan_style: resolvedPlanStyle,
      deadline: resolvedDeadline,
      hours_per_day: resolvedHoursPerDay,
      working_days: resolvedWorkingDays,
      current_baseline_text: resolvedBaseline.slice(0, 500),
      status: 'ACTIVE',
      current_week_number: 1,
      day_time_map_json: resolvedDayTimeMap || (profile?.day_time_map_json as DayTimeMap) || defaultDayMap,
      journey_memory_json: journeyMemory,
      previous_roadmap_json: (resolvedPreviousRoadmap as Record<string, unknown>) ?? null,
    }).select('id').single();

    if (goalError || !goal) throw new Error(goalError?.message || 'Failed to save goal');
    createdGoalId = goal.id;

    // 2. Insert Milestones
    const milestoneInserts = body.milestones.slice(0, 8).map((m, idx) => ({
      goal_id: goal.id,
      position: idx + 1,
      title: m.title.trim().slice(0, 100),
      expected_result: m.expected_result.trim().slice(0, 250),
      estimated_hours: Number(m.estimated_hours) > 0 ? Number(m.estimated_hours) : 10,
      target_metric_value: m.target_metric_value ?? null,
      target_metric_unit: m.target_metric_unit ? String(m.target_metric_unit).slice(0, 20) : null,
      status: (idx === 0 ? 'ACTIVE' : 'UPCOMING') as 'ACTIVE' | 'UPCOMING',
      competency_status: (idx === 0 ? 'CURRENT_FOCUS' : 'UPCOMING') as 'CURRENT_FOCUS' | 'UPCOMING',
    }));

    const { data: createdMilestones, error: milestoneError } = await admin.from('milestones').insert(milestoneInserts).select('id, position');
    if (milestoneError || !createdMilestones || createdMilestones.length === 0) throw new Error(milestoneError?.message || 'Failed to save milestones');

    const activeMilestone = createdMilestones.find((m) => m.position === 1) || createdMilestones[0];
    const activeMilestoneId = activeMilestone.id;

    // Optional: record fixed & followup onboarding answers
    const answersToInsert: Array<{
      goal_id: string;
      stage: 'FIXED' | 'AI_FOLLOWUP';
      question_index: number;
      question_text: string;
      answer_text: string;
    }> = [
      { goal_id: goal.id, stage: 'FIXED', question_index: 1, question_text: 'Goal & Why', answer_text: `${resolvedGoalTitle} — ${resolvedGoalWhy}`.slice(0, 500) },
      { goal_id: goal.id, stage: 'FIXED', question_index: 2, question_text: 'Deadline', answer_text: resolvedDeadline.slice(0, 500) },
      { goal_id: goal.id, stage: 'FIXED', question_index: 3, question_text: 'Schedule', answer_text: `${resolvedHoursPerDay}h/day on days ${resolvedWorkingDays.join(',')}`.slice(0, 500) },
      { goal_id: goal.id, stage: 'FIXED', question_index: 4, question_text: 'Current Baseline', answer_text: resolvedBaseline.slice(0, 500) },
      { goal_id: goal.id, stage: 'FIXED', question_index: 5, question_text: 'Constraints', answer_text: resolvedConstraints.slice(0, 500) },
    ];

    const rawFollowups = body.followup_qa || body.followupQa;
    if (Array.isArray(rawFollowups)) {
      rawFollowups.forEach((f, idx) => {
        if (typeof f === 'object' && f !== null && 'question' in f && 'answer' in f) {
          answersToInsert.push({
            goal_id: goal.id,
            stage: 'AI_FOLLOWUP',
            question_index: idx + 1,
            question_text: String((f as { question: unknown }).question || `Question ${idx + 1}`).slice(0, 500),
            answer_text: String((f as { answer: unknown }).answer || '').slice(0, 500),
          });
        }
      });
    }

    try {
      await admin.from('onboarding_answers').insert(answersToInsert);
    } catch {
      // Non-fatal if onboarding answers insert fails
    }

    // 3. Run Pipeline 3 for Week 1 Tasks
    const firewall = await checkAIFirewall({ userId: user.id, userIp: request.headers.get('x-forwarded-for'), pipeline: 'PIPELINE_3', goalId: goal.id });
    const contextPack = buildContextPack(profile?.person_memory_json, journeyMemory, resolvedCategory, 15);
    const todayStr = new Date().toISOString().slice(0, 10);

    const planOutput = await executeAIPipeline<Pipeline3Output>({
      pipeline: 'PIPELINE_3',
      userId: user.id,
      goalId: goal.id,
      model: firewall.allowed ? firewall.model : 'gemini-3.5-flash-lite',
      language: (profile?.language as 'EN' | 'BN') || 'EN',
      country: profile?.country || 'BD',
      category: resolvedCategory,
      variables: {
        goal_title: resolvedGoalTitle,
        goal_why: resolvedGoalWhy,
        execution_mode: resolvedExecutionMode,
        plan_style: resolvedPlanStyle,
        week_number: 1,
        total_weeks: resolvedTotalWeeks,
        week_start_date: todayStr,
        hours_per_day: resolvedHoursPerDay,
        working_days_dates_json: resolvedWorkingDays,
        day_time_map_json: resolvedDayTimeMap || profile?.day_time_map_json || defaultDayMap,
        context_pack_json: contextPack,
        user_state: 'STEADY',
        win_strategy_directive: 'Build momentum with clear, doable first steps',
        behavior_signals_json: {},
        active_milestone_json: milestoneInserts[0],
        upcoming_milestone_json: milestoneInserts[1] || null,
        last_two_weekly_summaries_json: [],
        recent_day_notes_json: [],
        carried_tasks_json: [],
        flagged_not_useful_tasks_json: [],
        user_custom_week_focus: '',
      },
    }, Pipeline3WeeklyPlannerSchema);

    // 4. Insert Week 1 Tasks
    const taskInserts = planOutput.tasks.map((t, idx) => ({
      goal_id: goal.id,
      milestone_id: activeMilestoneId,
      week_number: 1,
      task_type: t.task_type,
      adaptation_policy: t.adaptation_policy,
      sequence_order: t.sequence_order || idx + 1,
      target_count: t.target_count || 1,
      title: t.title.slice(0, 120),
      estimate_minutes: t.estimate_minutes || 45,
      done_means: (t.done_means || '').slice(0, 200),
      how_to_steps_json: {
        example: t.how_to_steps?.example || '',
        steps: (t.how_to_steps?.steps || []).map((s) => ({
          step_number: s.step_number,
          text: s.text,
          minutes: s.minutes,
          done: false,
          done_at: null,
        })),
      },
      min_version_10m: (t.min_version_10m || '').slice(0, 200),
      why_it_matters: (t.why_it_matters || '').slice(0, 200),
      used_context_ids: t.used_context_ids || [],
      is_stretch_task: t.is_stretch_task || false,
      status: 'PENDING' as const,
    }));

    const { error: taskError } = await admin.from('tasks').insert(taskInserts);
    if (taskError) throw new Error(`Failed to insert tasks: ${taskError.message}`);

    return NextResponse.json({ ok: true, goalId: goal.id });
  } catch (err) {
    if (createdGoalId) {
      // Rollback: delete orphan goal
      await admin.from('goals').delete().eq('id', createdGoalId);
    }
    const msg = err instanceof Error ? err.message : 'Lock and plan failed';
    return NextResponse.json({ error: 'LOCK_AND_PLAN_FAILED', details: msg }, { status: 500 });
  }
}
