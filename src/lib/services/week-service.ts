import 'server-only';
/**
 * 1. Purpose: Orchestrates idempotent Week Review (Pipeline 5) and delegates Week N+1 planning.
 * 2. Spec Ref: UI Design Guide Category C Screen 37, Category H Screens 97-103, and Pipeline 5.
 * 3. Called By: /api/weeks/review and /api/weeks/complete.
 * 4. Calls: Admin Supabase client, Pipeline 5, persona-engine, and week-rollover-service.
 */

import { createAdminClient } from '@/lib/db/admin';
import { executeAIPipeline } from '@/lib/ai/assembler';
import { AIFirewallError, checkAIFirewall } from '@/lib/ai/firewall';
import { buildContextPack } from '@/lib/ai/context-pack';
import { evaluatePersonaProfile } from '@/lib/ai/persona-engine';
import { Pipeline5WeeklyReviewSchema, type Pipeline5Output } from '@/types/ai-schemas';
import type { TaskRow } from '@/types/db/goal-tables';
import { planNextWeek, type PlanNextWeekResult } from './week-rollover-service';

export interface ReviewWeekResult {
  weeklyReviewId: string;
  weekNumber: number;
  alreadyReviewed: boolean;
}

export type AdvanceWeekResult = PlanNextWeekResult;

export async function reviewWeek(
  userId: string,
  goalId: string
): Promise<ReviewWeekResult> {
  const admin = createAdminClient();

  const { data: goal, error: goalErr } = await admin
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .eq('user_id', userId)
    .single();

  if (goalErr || !goal) throw new Error('Goal not found');
  const currentWeek = goal.current_week_number;

  // Idempotency check: return existing COMPLETED review in <200ms without calling Gemini
  const { data: existingReview } = await admin
    .from('weekly_reviews')
    .select('id, job_status')
    .eq('goal_id', goalId)
    .eq('week_number', currentWeek)
    .maybeSingle();

  if (existingReview && existingReview.job_status === 'COMPLETED') {
    return {
      weeklyReviewId: existingReview.id,
      weekNumber: currentWeek,
      alreadyReviewed: true,
    };
  }

  const [{ data: user }, { data: milestones }, { data: weekTasks }, { data: dayNotes }] =
    await Promise.all([
      admin
        .from('users')
        .select('id, person_memory_json, day_time_map_json, language, country')
        .eq('id', userId)
        .single(),
      admin.from('milestones').select('*').eq('goal_id', goalId).order('position', { ascending: true }),
      admin.from('tasks').select('*').eq('goal_id', goalId).eq('week_number', currentWeek),
      admin.from('day_notes').select('*').eq('goal_id', goalId).eq('digested_in_plan', false),
    ]);

  const tasks = (weekTasks || []) as TaskRow[];
  const completedTasks = tasks.filter((t) => t.status === 'DONE');
  const carriedOrSkipped = tasks.filter((t) => t.status !== 'DONE');
  const contextPack = buildContextPack(
    user?.person_memory_json,
    goal.journey_memory_json,
    goal.category,
    15
  );
  const persona = evaluatePersonaProfile({
    scheduledWorkingDays: goal.working_days || [1, 2, 3, 4, 5],
    lastActivityDate: goal.last_activity_date || null,
    tasksLast14Days: tasks,
    evidenceLast10: [],
  });

  const firewall5 = await checkAIFirewall({
    userId,
    pipeline: 'PIPELINE_5',
    goalId,
  });
  if (!firewall5.allowed) {
    throw new AIFirewallError(firewall5.reason || 'FIREWALL_BLOCKED', firewall5.retryAfterSeconds);
  }

  const p5Output = await executeAIPipeline<Pipeline5Output>(
    {
      pipeline: 'PIPELINE_5',
      userId,
      goalId,
      model: firewall5.model,
      language: (user?.language as 'EN' | 'BN') || 'EN',
      country: user?.country || 'BD',
      category: goal.category,
      variables: {
        goal_title: goal.title,
        execution_mode: goal.execution_mode,
        plan_style: goal.plan_style,
        week_number: currentWeek,
        total_weeks: 12,
        current_baseline: goal.current_baseline_text,
        user_state: persona.user_state,
        win_strategy_directive: persona.win_strategy_directive,
        behavior_signals_json: {
          velocity_trend: persona.velocity_trend,
          rhythm_pattern: persona.rhythm_pattern,
          friction_type: persona.friction_type,
          proof_affinity: persona.proof_affinity,
        },
        completed_tasks_json: completedTasks,
        carried_or_skipped_tasks_json: carriedOrSkipped,
        reality_check_measurements_json: [],
        day_notes_json: dayNotes || [],
        effort_ratings_summary_json: {},
        all_milestones_json: milestones || [],
        context_pack_json: contextPack,
        day_time_map_json: user?.day_time_map_json || {},
      },
    },
    Pipeline5WeeklyReviewSchema
  );

  await admin
    .from('day_notes')
    .update({ digested_in_plan: true })
    .eq('goal_id', goalId)
    .eq('digested_in_plan', false);

  if (p5Output.milestone_competency_updates?.length) {
    for (const update of p5Output.milestone_competency_updates) {
      await admin
        .from('milestones')
        .update({ competency_status: update.competency_status })
        .eq('goal_id', goalId)
        .eq('position', update.milestone_position);
    }
  }

  const genKey = `${goalId}_week_${currentWeek}_${Date.now()}`;
  const { data: reviewRow, error: reviewErr } = await admin
    .from('weekly_reviews')
    .upsert(
      {
        goal_id: goalId,
        week_number: currentWeek,
        ai_summary: p5Output.ai_summary,
        three_bullet_lines: p5Output.three_bullet_lines,
        on_track: p5Output.on_track,
        plan_changes: p5Output.plan_changes || '',
        partner_share_line: p5Output.partner_share_line,
        milestone_competency_updates_json: p5Output.milestone_competency_updates,
        memory_confirmation_prompt_json: p5Output.memory_confirmation_question || null,
        generation_key: genKey,
        job_status: 'COMPLETED',
      },
      { onConflict: 'goal_id,week_number' }
    )
    .select('id')
    .single();

  if (reviewErr || !reviewRow) throw new Error('Failed to create weekly review');

  await admin.from('notifications').insert({
    user_id: userId,
    type: 'WEEKLY_SUMMARY',
    title: `Week ${currentWeek} Summary Ready`,
    body: p5Output.three_bullet_lines?.[0] || 'Review your progress and next steps.',
    target_screen: `/weekly-summary/${reviewRow.id}`,
  });

  return {
    weeklyReviewId: reviewRow.id,
    weekNumber: currentWeek,
    alreadyReviewed: false,
  };
}

export async function advanceWeek(
  userId: string,
  goalId: string
): Promise<AdvanceWeekResult> {
  await reviewWeek(userId, goalId);
  return planNextWeek(userId, goalId);
}
