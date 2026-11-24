import 'server-only';
/**
 * 1. Purpose: Domain service for Pipeline 7 (Goal completion & Journey Card) and Pipeline 3 (Week rollover).
 * 2. Spec Ref: UI Design Guide Category H Screens 97-103, Category C Screen 37, and Pipelines 3, 7.
 * 3. Called By: week-service.ts advanceWeek.
 * 4. Calls: Admin Supabase client, Pipeline 7, Pipeline 3, and firewall.
 */

import { createAdminClient } from '@/lib/db/admin';
import { executeAIPipeline } from '@/lib/ai/assembler';
import { AIFirewallError, checkAIFirewall } from '@/lib/ai/firewall';
import {
  Pipeline3WeeklyPlannerSchema,
  Pipeline7NextGoalBridgeSchema,
  type Pipeline3Output,
  type Pipeline7Output,
} from '@/types/ai-schemas';
import type { GoalRow, MilestoneRow, TaskRow } from '@/types/db/goal-tables';
import type { PersonaProfile } from '@/lib/ai/persona-engine';

export interface CompleteGoalParams {
  userId: string;
  goal: GoalRow;
  allMilestones: MilestoneRow[];
  completedTasks: TaskRow[];
  contextPack: unknown;
  weeklyReviewId: string;
}

export async function completeGoalWithJourneyCard(params: CompleteGoalParams) {
  const { userId, goal, allMilestones, completedTasks, contextPack, weeklyReviewId } = params;
  const admin = createAdminClient();

  const { data: proofs } = await admin
    .from('evidence')
    .select('id, uploaded_at')
    .eq('goal_id', goal.id)
    .order('uploaded_at', { ascending: true });

  const evidenceList = proofs || [];
  const firstProofId = evidenceList[0]?.id;
  const lastProofId = evidenceList[evidenceList.length - 1]?.id;
  const featuredEvidenceIds = [firstProofId, lastProofId].filter(Boolean) as string[];

  const { data: user } = await admin
    .from('users')
    .select('language, country')
    .eq('id', userId)
    .single();

  const firewall7 = await checkAIFirewall({ userId, pipeline: 'PIPELINE_7', goalId: goal.id });
  if (!firewall7.allowed) {
    throw new AIFirewallError(firewall7.reason || 'FIREWALL_BLOCKED', firewall7.retryAfterSeconds);
  }
  const p7Output = await executeAIPipeline<Pipeline7Output>(
    {
      pipeline: 'PIPELINE_7',
      userId,
      goalId: goal.id,
      model: firewall7.model,
      language: (user?.language as 'EN' | 'BN') || 'EN',
      country: user?.country || 'BD',
      category: goal.category,
      variables: {
        goal_title: goal.title,
        goal_why: goal.why,
        goal_category: goal.category,
        execution_mode: goal.execution_mode,
        total_weeks: goal.current_week_number,
        active_days_count: completedTasks.length,
        current_baseline: goal.current_baseline_text,
        completed_milestones_json: allMilestones,
        top_proofs_summary_json: evidenceList.slice(0, 5),
        comeback_weeks_count: 0,
        context_pack_json: contextPack,
      },
    },
    Pipeline7NextGoalBridgeSchema
  );

  const publicSlug = `j_${Math.random().toString(36).slice(2, 10)}`;
  await admin.from('journey_cards').insert({
    goal_id: goal.id,
    user_id: userId,
    public_slug: publicSlug,
    journey_card_headline: p7Output.journey_card_headline,
    day1_vs_now_story: p7Output.day1_vs_now_story,
    comeback_highlight_line: p7Output.comeback_highlight_line || null,
    featured_evidence_ids: featuredEvidenceIds,
    next_goal_suggestions_json: p7Output.next_goal_suggestions,
    visibility: 'PRIVATE',
    status: 'ACTIVE',
  });

  await admin
    .from('goals')
    .update({
      status: 'COMPLETED',
      completed_at: new Date().toISOString(),
    })
    .eq('id', goal.id);

  await admin.from('notifications').insert({
    user_id: userId,
    type: 'JOURNEY_CARD_EARNED',
    title: 'Journey Card Earned! 🎓',
    body: `You completed ${goal.title}! Your 100% free Journey Card is ready to share.`,
    target_screen: `/journey/${publicSlug}`,
  });

  return {
    weeklyReviewId,
    isGoalCompleted: true,
    journeyCardSlug: publicSlug,
  };
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
}

export async function rolloverToNextWeek(params: RolloverWeekParams) {
  const {
    userId,
    goal,
    allMilestones,
    activeMilestone,
    carriedOrSkipped,
    contextPack,
    persona,
    lastSummary,
    weeklyReviewId,
  } = params;
  const admin = createAdminClient();
  const nextWeekNumber = goal.current_week_number + 1;

  const { data: user } = await admin
    .from('users')
    .select('day_time_map_json, language, country')
    .eq('id', userId)
    .single();

  const firewall3 = await checkAIFirewall({ userId, pipeline: 'PIPELINE_3', goalId: goal.id });
  if (!firewall3.allowed) {
    throw new AIFirewallError(firewall3.reason || 'FIREWALL_BLOCKED', firewall3.retryAfterSeconds);
  }
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
        total_weeks: 12,
        week_start_date: new Date().toISOString().slice(0, 10),
        hours_per_day: goal.hours_per_day,
        working_days_dates_json: goal.working_days,
        day_time_map_json: user?.day_time_map_json || {},
        context_pack_json: contextPack,
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
        last_two_weekly_summaries_json: [lastSummary],
        recent_day_notes_json: [],
        carried_tasks_json: carriedOrSkipped,
        flagged_not_useful_tasks_json: [],
        user_custom_week_focus: '',
      },
    },
    Pipeline3WeeklyPlannerSchema
  );

  for (const t of p3Output.tasks) {
    const targetMilestone =
      allMilestones.find((m) => m.position === t.milestone_position) || activeMilestone;

    await admin.from('tasks').insert({
      goal_id: goal.id,
      milestone_id: targetMilestone.id,
      week_number: nextWeekNumber,
      task_type: t.task_type,
      adaptation_policy: t.adaptation_policy,
      sequence_order: t.sequence_order,
      target_count: t.target_count,
      title: t.title,
      done_means: t.done_means,
      how_to_steps_json: {
        steps: (t.how_to_steps?.steps || []).map((s) => ({
          step_number: s.step_number,
          text: s.text,
          minutes: s.minutes,
          done: false,
          done_at: null,
        })),
        example: t.how_to_steps?.example || '',
      },
      min_version_10m: t.min_version_10m,
      why_it_matters: t.why_it_matters,
      used_context_ids: t.used_context_ids || [],
      estimate_minutes: t.estimate_minutes,
      is_stretch_task: t.is_stretch_task,
      status: 'PENDING',
    });
  }

  await admin
    .from('goals')
    .update({
      current_week_number: nextWeekNumber,
      streak_weeks: (goal.streak_weeks || 0) + 1,
      today_context_line: p3Output.today_context_line || goal.today_context_line,
    })
    .eq('id', goal.id);

  return {
    weeklyReviewId,
    isGoalCompleted: false,
    nextWeekNumber,
  };
}
