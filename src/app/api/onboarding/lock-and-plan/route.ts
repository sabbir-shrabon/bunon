import { NextResponse, type NextRequest } from 'next/server';
/**
 * 1. Purpose: Pipeline 3 API endpoint for locking the roadmap and generating Week 1 tasks.
 * 2. Spec Ref: Prompt Catalog v2.5 Section 7 Pipeline 3, Screen 20/22 & Two-Path Onboarding.
 * 3. Called By: Screen 20 "Build Week 1 & start Day 1".
 * 4. Calls: Server Supabase client, AI Firewall, Assembler, and context-pack.
 */

import { createClient } from '@/lib/db/server';
import { createAdminClient } from '@/lib/db/admin';
import { checkAIFirewall } from '@/lib/ai/firewall';
import { executeAIPipeline } from '@/lib/ai/assembler';
import { buildContextPack } from '@/lib/ai/context-pack';
import { formatAIFirewallHttpError, guardApiRoute } from '@/lib/services/access-guard.service';
import { Pipeline3WeeklyPlannerSchema, type Pipeline3Output } from '@/types/ai-schemas';
import type { DayTimeMap, OutlineMode } from '@/types/domain';
import {
  LockAndPlanRequestSchema,
  normalizeReminderTime,
  type ConfirmedMemoryFact,
} from './validation';
import {
  cleanupOrphanGoals,
  processConfirmedMemoryFacts,
  buildOnboardingAnswers,
} from './helpers';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const guard = await guardApiRoute(user.id);
  if (!guard.ok) return guard.response;

  let rawJson: unknown;
  try {
    rawJson = await request.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON', message: 'Malformed JSON payload' }, { status: 400 });
  }

  const parsed = LockAndPlanRequestSchema.safeParse(rawJson);
  if (!parsed.success) {
    return NextResponse.json({
      error: 'INVALID_REQUEST_BODY',
      message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
    }, { status: 400 });
  }

  const body = parsed.data;
  const admin = createAdminClient();
  await cleanupOrphanGoals(admin, user.id);

  // Enforce Free / Pro active goal limit from live system_settings
  const { data: profile } = await admin.from('users').select('pro_until, language, country, person_memory_json, day_time_map_json').eq('id', user.id).single();
  const isPro = guard.profile.isPro;
  const maxActiveGoals = isPro ? guard.settings.pro_roadmap_allowance : guard.settings.free_roadmap_allowance;
  const { count: activeCount } = await admin.from('goals').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'ACTIVE');

  if ((activeCount || 0) >= maxActiveGoals) {
    return NextResponse.json({
      error: 'GOAL_LIMIT_REACHED',
      message: isPro ? `You have ${maxActiveGoals} active goals. Finish or pause one first.` : 'Free plan includes 1 active goal. Upgrade to Pro for more.',
    }, { status: 400 });
  }

  // Enforce AI Firewall BEFORE creating goal/milestones so AI_KILL_SWITCH_ACTIVE / caps cleanly abort
  const firewall = await checkAIFirewall({
    userId: user.id,
    userIp: request.headers.get('x-forwarded-for'),
    pipeline: 'PIPELINE_3',
  });
  if (!firewall.allowed) {
    const err = formatAIFirewallHttpError(firewall.reason, firewall.retryAfterSeconds);
    return NextResponse.json(err.body, { status: err.status });
  }

  const resolvedGoalTitle = (body.goalTitle || body.goal_title || '').trim();
  const resolvedGoalWhy = (body.goalWhy || body.goal_why || '').trim();
  const resolvedCategory = body.goalCategory || body.goal_category || body.category || 'OTHER';
  const resolvedExecutionMode = body.executionMode || body.execution_mode || 'deliverable_queue';
  const resolvedPlanStyle = body.planStyle || body.plan_style || 'DAILY_ADAPTIVE';
  const resolvedOutlineMode: OutlineMode = body.outlineMode || body.outline_mode || 'BACKGROUND_CONTEXT';
  const resolvedOutlineSummary = (body.extractedOutlineSummary || body.extracted_outline_summary || null)?.trim() || null;
  const resolvedDeadline = (body.deadlineDate || body.deadline_date || body.deadline || '').trim();
  const resolvedHoursPerDay = Math.max(0.5, Math.min(8.0, Number(body.hoursPerDay || body.hours_per_day || 2.0)));
  const resolvedWorkingDays = (body.workingDays && body.workingDays.length > 0)
    ? body.workingDays
    : (body.working_days && body.working_days.length > 0)
      ? body.working_days
      : [0, 1, 2, 3, 4];
  const resolvedBaseline = (body.currentBaseline || body.current_baseline || '').trim();
  const resolvedConstraints = (body.constraints || '').trim();
  const resolvedTotalWeeks = body.totalWeeks || body.total_weeks || 12;
  const resolvedReminder = normalizeReminderTime(body.reminderTime || body.reminder_time);
  const resolvedPreviousRoadmap = body.previousRoadmapJson ?? body.previous_roadmap_json ?? null;
  const resolvedDayTimeMap = (body.day_time_map || body.day_time_map_json || body.dayTimeMap) as DayTimeMap | undefined;

  if (resolvedReminder) {
    await admin.from('users').update({ reminder_time: resolvedReminder }).eq('id', user.id);
  }

  // Handle confirmed memory facts from Onboarding Step A
  const confirmedFacts: ConfirmedMemoryFact[] = body.confirmedMemoryFacts || body.confirmed_memory_facts || [];
  const newGoalItems = await processConfirmedMemoryFacts(admin, user.id, confirmedFacts, resolvedCategory, profile?.person_memory_json);

  const journeyMemory = { version: 1, items: newGoalItems, missing_context_boosters: body.boosters || [] };
  const defaultDayMap: DayTimeMap = {
    sat: { available_minutes: 60 }, sun: { available_minutes: 60 }, mon: { available_minutes: 60 },
    tue: { available_minutes: 60 }, wed: { available_minutes: 60 }, thu: { available_minutes: 60 }, fri: { available_minutes: 60 },
  };

  let createdGoalId: string | null = null;
  try {
    const { data: goal, error: goalError } = await admin.from('goals').insert({
      user_id: user.id,
      title: resolvedGoalTitle.slice(0, 150),
      why: resolvedGoalWhy.slice(0, 350),
      category: resolvedCategory,
      execution_mode: resolvedExecutionMode,
      plan_style: resolvedPlanStyle,
      outline_mode: resolvedOutlineMode,
      extracted_outline_summary: resolvedOutlineSummary ? resolvedOutlineSummary.slice(0, 1500) : null,
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
    const answersToInsert = buildOnboardingAnswers(
      goal.id, resolvedGoalTitle, resolvedGoalWhy, resolvedDeadline,
      resolvedHoursPerDay, resolvedWorkingDays, resolvedBaseline, resolvedConstraints,
      body.followup_qa || body.followupQa
    );
    try { await admin.from('onboarding_answers').insert(answersToInsert); } catch { /* non-fatal */ }

    // Run Pipeline 3 for Week 1 Tasks using firewall-selected model
    const contextPack = buildContextPack(profile?.person_memory_json, journeyMemory, resolvedCategory, 15);
    const todayStr = new Date().toISOString().slice(0, 10);

    const planOutput = await executeAIPipeline<Pipeline3Output>({
      pipeline: 'PIPELINE_3',
      userId: user.id,
      goalId: goal.id,
      model: firewall.model,
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

    const taskInserts = planOutput.tasks.map((t, idx) => ({
      goal_id: goal.id,
      milestone_id: activeMilestone.id,
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
    if (createdGoalId) { await admin.from('goals').delete().eq('id', createdGoalId); }
    const msg = err instanceof Error ? err.message : 'Lock and plan failed';
    return NextResponse.json({ error: 'LOCK_AND_PLAN_FAILED', details: msg }, { status: 500 });
  }
}
