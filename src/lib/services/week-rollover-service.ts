import 'server-only';
/**
 * 1. Purpose: Idempotent domain service for Pipeline 3 Week N+1 planning and rollover execution.
 * 2. Spec Ref: UI Design Guide Category C Screen 37 and Pipeline 3 / Pipeline 7.
 * 3. Called By: /api/weeks/plan-next and week-service.ts advanceWeek.
 * 4. Calls: Admin Supabase client, Pipeline 3, goal-signals, memory-ops, and goal-completion.service.
 */

import { createAdminClient } from '@/lib/db/admin';
import { executeAIPipeline } from '@/lib/ai/assembler';
import { AIFirewallError, checkAIFirewall } from '@/lib/ai/firewall';
import { buildContextPack } from '@/lib/ai/context-pack';
import { loadGoalIntelligenceSignals, type GoalIntelligenceSignals } from '@/lib/ai/goal-signals';
import { applyProposedMemoryOps } from '@/lib/ai/memory-ops';
import type { PersonaProfile } from '@/lib/ai/persona-engine';
import { Pipeline3WeeklyPlannerSchema, type Pipeline3Output } from '@/types/ai-schemas';
import type { GoalRow, MilestoneRow, TaskRow } from '@/types/db/goal-tables';
import { completeGoalWithJourneyCard } from './goal-completion.service';
import { buildNextWeekTaskInserts } from './week-task-mapper';

export interface PlanNextWeekResult {
  weeklyReviewId: string;
  isGoalCompleted: boolean;
  journeyCardSlug?: string;
  nextWeekNumber?: number;
}

export interface RolloverWeekParams {
  userId: string;
  goal: GoalRow;
  allMilestones: MilestoneRow[];
  activeMilestone: MilestoneRow;
  carriedOrSkipped: TaskRow[];
  contextPack: unknown;
  persona: PersonaProfile;
  lastSummary: string;
  weeklyReviewId: string;
  signals?: GoalIntelligenceSignals;
}

export async function rolloverToNextWeek(params: RolloverWeekParams): Promise<PlanNextWeekResult> {
  const { userId, goal, allMilestones, activeMilestone, carriedOrSkipped, contextPack, lastSummary, weeklyReviewId } =
    params;
  const admin = createAdminClient();
  const nextWeekNumber = goal.current_week_number + 1;

  const { data: existingNextTasks } = await admin
    .from('tasks')
    .select('id')
    .eq('goal_id', goal.id)
    .eq('week_number', nextWeekNumber)
    .limit(1);

  if (existingNextTasks && existingNextTasks.length > 0) {
    await admin
      .from('goals')
      .update({ current_week_number: nextWeekNumber, streak_weeks: (goal.streak_weeks || 0) + 1 })
      .eq('id', goal.id)
      .lt('current_week_number', nextWeekNumber);
    return { weeklyReviewId, isGoalCompleted: false, nextWeekNumber };
  }

  const [{ data: user }, { data: recentReviews }, signals] = await Promise.all([
    admin.from('users').select('day_time_map_json, language, country, preferred_coaching_tone').eq('id', userId).single(),
    admin
      .from('weekly_reviews')
      .select('week_number, ai_summary, on_track')
      .eq('goal_id', goal.id)
      .order('week_number', { ascending: false })
      .limit(2),
    params.signals ? Promise.resolve(params.signals) : loadGoalIntelligenceSignals({ supabaseAdmin: admin, goal }),
  ]);

  const firewall3 = await checkAIFirewall({ userId, pipeline: 'PIPELINE_3', goalId: goal.id });
  if (!firewall3.allowed) {
    throw new AIFirewallError(firewall3.reason || 'FIREWALL_BLOCKED', firewall3.retryAfterSeconds);
  }

  const hasGoalDayMap = goal.day_time_map_json && Object.keys(goal.day_time_map_json).length > 0;
  const resolvedDayTimeMap = hasGoalDayMap ? goal.day_time_map_json : user?.day_time_map_json || {};
  const lastTwoSummaries = recentReviews?.length ? recentReviews : lastSummary ? [lastSummary] : [];
  const { persona } = signals;

  const p3Output = await executeAIPipeline<Pipeline3Output>(
    {
      pipeline: 'PIPELINE_3',
      userId,
      goalId: goal.id,
      model: firewall3.model,
      language: (user?.language as 'EN' | 'BN') || 'EN',
      country: user?.country || 'BD',
      category: goal.category,
      variables: {
        goal_title: goal.title,
        goal_why: goal.why,
        execution_mode: goal.execution_mode,
        plan_style: goal.plan_style,
        week_number: nextWeekNumber,
        total_weeks: signals.totalWeeks,
        week_start_date: new Date().toISOString().slice(0, 10),
        hours_per_day: goal.hours_per_day,
        working_days_dates_json: goal.working_days,
        day_time_map_json: resolvedDayTimeMap,
        context_pack_json: contextPack,
        preferred_coaching_tone: user?.preferred_coaching_tone || 'GENTLE',
        user_state: persona.user_state,
        win_strategy_directive: persona.win_strategy_directive,
        behavior_signals_json: {
          velocity_trend: persona.velocity_trend,
          rhythm_pattern: persona.rhythm_pattern,
          friction_type: persona.friction_type,
          proof_affinity: persona.proof_affinity,
        },
        active_milestone_json: activeMilestone,
        upcoming_milestone_json: allMilestones[activeMilestone.position] || null,
        last_two_weekly_summaries_json: lastTwoSummaries,
        recent_day_notes_json: signals.recentDayNotes,
        carried_tasks_json: carriedOrSkipped,
        flagged_not_useful_tasks_json: signals.flaggedNotUsefulTasks,
        user_custom_week_focus: goal.custom_week_intent || '',
      },
    },
    Pipeline3WeeklyPlannerSchema
  );

  const taskInserts = buildNextWeekTaskInserts(goal.id, nextWeekNumber, p3Output.tasks, allMilestones, activeMilestone);
  if (taskInserts.length > 0) {
    const { error: insertErr } = await admin.from('tasks').insert(taskInserts);
    if (insertErr) throw new Error(`Failed to insert Week ${nextWeekNumber} tasks: ${insertErr.message}`);
  }

  await applyProposedMemoryOps({
    supabaseAdmin: admin,
    userId,
    goalId: goal.id,
    ops: p3Output.proposed_memory_ops,
  });

  await admin
    .from('goals')
    .update({
      current_week_number: nextWeekNumber,
      streak_weeks: (goal.streak_weeks || 0) + 1,
      today_context_line: p3Output.today_context_line || goal.today_context_line,
    })
    .eq('id', goal.id);

  return { weeklyReviewId, isGoalCompleted: false, nextWeekNumber };
}

export async function planNextWeek(userId: string, goalId: string): Promise<PlanNextWeekResult> {
  const admin = createAdminClient();
  const { data: goalRow, error: goalErr } = await admin
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .eq('user_id', userId)
    .single();
  if (goalErr || !goalRow) throw new Error('Goal not found');
  const goal = goalRow as unknown as GoalRow;

  const [{ data: user }, { data: milestones }, { data: weekTasks }, { data: reviewRow }] = await Promise.all([
    admin.from('users').select('person_memory_json').eq('id', userId).single(),
    admin.from('milestones').select('*').eq('goal_id', goalId).order('position', { ascending: true }),
    admin.from('tasks').select('*').eq('goal_id', goalId).eq('week_number', goal.current_week_number),
    admin.from('weekly_reviews').select('id, ai_summary').eq('goal_id', goalId).eq('week_number', goal.current_week_number).maybeSingle(),
  ]);

  const allMilestones = (milestones || []) as unknown as MilestoneRow[];
  const tasks = (weekTasks || []) as unknown as TaskRow[];
  const completedTasks = tasks.filter((t) => t.status === 'DONE');
  const carriedOrSkipped = tasks.filter((t) => t.status !== 'DONE');
  const activeMilestone = allMilestones.find((m) => m.status === 'ACTIVE') || allMilestones[0];
  const isFinalMilestone = activeMilestone?.position === allMilestones.length;
  const contextPack = buildContextPack(user?.person_memory_json, goal.journey_memory_json, goal.category, 15);
  const weeklyReviewId = reviewRow?.id || '';

  if (isFinalMilestone && carriedOrSkipped.length === 0) {
    return completeGoalWithJourneyCard({ userId, goal, allMilestones, completedTasks, contextPack, weeklyReviewId });
  }

  const signals = await loadGoalIntelligenceSignals({ supabaseAdmin: admin, goal });
  return rolloverToNextWeek({
    userId,
    goal,
    allMilestones,
    activeMilestone,
    carriedOrSkipped,
    contextPack,
    persona: signals.persona,
    lastSummary: reviewRow?.ai_summary || '',
    weeklyReviewId,
    signals,
  });
}
