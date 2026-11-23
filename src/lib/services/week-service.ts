import 'server-only';
/**
 * 1. Purpose: Orchestrates week completion, Pipeline 5 weekly review, and milestone competency updates.
 * 2. Spec Ref: UI Design Guide Category C Screen 37, Category H Screens 97-103, and Pipeline 5.
 * 3. Called By: /api/weeks/complete, /api/weekly-summary/[id], and background worker.
 * 4. Calls: Supabase client, Pipeline 5, persona-engine, and week-rollover-service.
 */

import { createAdminClient } from '@/lib/db/admin';
import { executeAIPipeline } from '@/lib/ai/assembler';
import { checkAIFirewall } from '@/lib/ai/firewall';
import { buildContextPack } from '@/lib/ai/context-pack';
import { evaluatePersonaProfile } from '@/lib/ai/persona-engine';
import { Pipeline5WeeklyReviewSchema, type Pipeline5Output } from '@/types/ai-schemas';
import type { TaskRow } from '@/types/db/goal-tables';
import { completeGoalWithJourneyCard, rolloverToNextWeek } from './week-rollover-service';

export interface AdvanceWeekResult {
  weeklyReviewId: string;
  isGoalCompleted: boolean;
  journeyCardSlug?: string;
  nextWeekNumber?: number;
}

export async function advanceWeek(
  userId: string,
  goalId: string
): Promise<AdvanceWeekResult> {
  const admin = createAdminClient();

  // 1. Fetch Goal, Milestones, and User
  const { data: goal, error: goalErr } = await admin
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .eq('user_id', userId)
    .single();

  if (goalErr || !goal) throw new Error('Goal not found');

  const { data: user } = await admin
    .from('users')
    .select('id, person_memory_json, day_time_map_json, language, country')
    .eq('id', userId)
    .single();

  const { data: milestones } = await admin
    .from('milestones')
    .select('*')
    .eq('goal_id', goalId)
    .order('position', { ascending: true });

  const allMilestones = milestones || [];
  const currentWeek = goal.current_week_number;

  // 2. Fetch completed tasks and queued day notes this week
  const { data: weekTasks } = await admin
    .from('tasks')
    .select('*')
    .eq('goal_id', goalId)
    .eq('week_number', currentWeek);

  const completedTasks = (weekTasks || []).filter((t) => t.status === 'DONE');
  const carriedOrSkipped = (weekTasks || []).filter((t) => t.status !== 'DONE');

  const { data: dayNotes } = await admin
    .from('day_notes')
    .select('*')
    .eq('goal_id', goalId)
    .eq('digested_in_plan', false);

  const contextPack = buildContextPack(
    user?.person_memory_json,
    goal.journey_memory_json,
    goal.category,
    15
  );

  const persona = evaluatePersonaProfile({
    scheduledWorkingDays: goal.working_days || [1, 2, 3, 4, 5],
    lastActivityDate: goal.last_activity_date || null,
    tasksLast14Days: (weekTasks || []) as TaskRow[],
    evidenceLast10: [],
  });

  // 3. Execute Pipeline 5: Weekly Review
  const firewall5 = await checkAIFirewall({
    userId,
    pipeline: 'PIPELINE_5',
    goalId,
  });

  const p5Output = await executeAIPipeline<Pipeline5Output>(
    {
      pipeline: 'PIPELINE_5',
      userId,
      goalId,
      model: firewall5.allowed ? firewall5.model : 'gemini-3.5-flash-lite',
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
        all_milestones_json: allMilestones,
        context_pack_json: contextPack,
        day_time_map_json: user?.day_time_map_json || {},
      },
    },
    Pipeline5WeeklyReviewSchema
  );

  // 4. Digest Day Notes ($0 save now digested)
  await admin
    .from('day_notes')
    .update({ digested_in_plan: true })
    .eq('goal_id', goalId)
    .eq('digested_in_plan', false);

  // 5. Update Milestones Competency Statuses
  if (p5Output.milestone_competency_updates?.length) {
    for (const update of p5Output.milestone_competency_updates) {
      await admin
        .from('milestones')
        .update({ competency_status: update.competency_status })
        .eq('goal_id', goalId)
        .eq('position', update.milestone_position);
    }
  }

  // 6. Save Weekly Review Record
  const genKey = `${goalId}_week_${currentWeek}_${Date.now()}`;
  const { data: reviewRow, error: reviewErr } = await admin
    .from('weekly_reviews')
    .insert({
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
    })
    .select('id')
    .single();

  if (reviewErr || !reviewRow) throw new Error('Failed to create weekly review');

  // Insert notification for weekly summary
  await admin.from('notifications').insert({
    user_id: userId,
    type: 'WEEKLY_SUMMARY',
    title: `Week ${currentWeek} Summary Ready`,
    body: p5Output.three_bullet_lines?.[0] || 'Review your progress and next steps.',
    target_screen: `/weekly-summary/${reviewRow.id}`,
  });

  // 7. Check if all milestones are DONE
  const activeMilestone = allMilestones.find((m) => m.status === 'ACTIVE') || allMilestones[0];
  const isFinalMilestone = activeMilestone?.position === allMilestones.length;
  const isAllTasksCompleted = carriedOrSkipped.length === 0;

  if (isFinalMilestone && isAllTasksCompleted) {
    return completeGoalWithJourneyCard({
      userId,
      goal,
      allMilestones,
      completedTasks,
      contextPack,
      weeklyReviewId: reviewRow.id,
    });
  }

  // 8. Rollover to Week N+1
  return rolloverToNextWeek({
    userId,
    goal,
    allMilestones,
    activeMilestone: activeMilestone || allMilestones[0],
    carriedOrSkipped,
    contextPack,
    persona,
    lastSummary: p5Output.ai_summary,
    weeklyReviewId: reviewRow.id,
  });
}
