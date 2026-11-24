import 'server-only';
/**
 * 1. Purpose: Domain service for Pipeline 6 roadmap re-planning and applying revised milestone structures.
 * 2. Spec Ref: UI Design Guide Category E Screens 52, 55, 56 and Pipeline 6.
 * 3. Called By: /api/goals/[id]/replan and roadmap-service.ts.
 * 4. Calls: Admin Supabase client, Pipeline 6, and context-pack.
 */

import { createAdminClient } from '@/lib/db/admin';
import { executeAIPipeline } from '@/lib/ai/assembler';
import { AIFirewallError, checkAIFirewall } from '@/lib/ai/firewall';
import { buildContextPack } from '@/lib/ai/context-pack';
import { Pipeline6ReplanSchema, type Pipeline6Output } from '@/types/ai-schemas';

export async function replanGoal(
  userId: string,
  goalId: string,
  replanReason: string,
  newDeadline?: string
) {
  const admin = createAdminClient();

  const { data: goal } = await admin
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .eq('user_id', userId)
    .single();

  if (!goal) throw new Error('Goal not found');

  const { data: user } = await admin
    .from('users')
    .select('id, person_memory_json, language, country')
    .eq('id', userId)
    .single();

  const { data: milestones } = await admin
    .from('milestones')
    .select('*')
    .eq('goal_id', goalId)
    .order('position', { ascending: true });

  const completedMilestones = (milestones || []).filter((m) => m.status === 'DONE');
  const unfinishedMilestones = (milestones || []).filter((m) => m.status !== 'DONE');

  const contextPack = buildContextPack(
    user?.person_memory_json,
    goal.journey_memory_json,
    goal.category,
    15
  );

  const firewall = await checkAIFirewall({ userId, pipeline: 'PIPELINE_6', goalId });
  if (!firewall.allowed) {
    throw new AIFirewallError(firewall.reason || 'FIREWALL_BLOCKED', firewall.retryAfterSeconds);
  }
  const deadlineDate = newDeadline || goal.deadline;

  const p6Output = await executeAIPipeline<Pipeline6Output>(
    {
      pipeline: 'PIPELINE_6',
      userId,
      goalId,
      model: firewall.model,
      language: (user?.language as 'EN' | 'BN') || 'EN',
      country: user?.country || 'BD',
      category: goal.category,
      variables: {
        goal_title: goal.title,
        goal_why: goal.why,
        execution_mode: goal.execution_mode,
        plan_style: goal.plan_style,
        replan_reason: replanReason,
        miss_cause: goal.last_miss_cause || '',
        user_state: goal.user_state,
        win_strategy_directive: 'Re-anchor on minimum viable deliverables',
        new_deadline_date: deadlineDate,
        remaining_weeks: 8,
        available_hours_remaining: 40,
        hours_per_day: goal.hours_per_day,
        working_days: goal.working_days,
        completed_milestones_json: completedMilestones,
        completed_tasks_summary_json: [],
        unfinished_milestones_json: unfinishedMilestones,
        context_pack_json: contextPack,
        recent_day_notes_json: [],
      },
    },
    Pipeline6ReplanSchema
  );

  return {
    replanSummary: p6Output.replan_summary,
    revisedMilestones: p6Output.revised_remaining_milestones,
    completedMilestones,
    deadline: deadlineDate,
  };
}

export async function applyReplan(
  userId: string,
  goalId: string,
  revisedMilestones: Pipeline6Output['revised_remaining_milestones'],
  newDeadline?: string
) {
  const admin = createAdminClient();

  // 1. Delete unfinished milestones
  await admin
    .from('milestones')
    .delete()
    .eq('goal_id', goalId)
    .neq('status', 'DONE');

  // 2. Insert revised milestones
  for (const m of revisedMilestones) {
    await admin.from('milestones').insert({
      goal_id: goalId,
      position: m.position,
      title: m.title,
      expected_result: m.expected_result,
      estimated_hours: m.estimated_hours,
      target_metric_value: m.target_metric_value || null,
      target_metric_unit: m.target_metric_unit || null,
      status: m.position === (revisedMilestones[0]?.position ?? 1) ? 'ACTIVE' : 'UPCOMING',
    });
  }

  // 3. Update restructure count & deadline
  const { data: currentGoal } = await admin
    .from('goals')
    .select('restructure_count')
    .eq('id', goalId)
    .single();

  const nextCount = ((currentGoal?.restructure_count as number) || 0) + 1;
  const updates: Record<string, unknown> = {
    restructure_count: nextCount,
  };
  if (newDeadline) updates.deadline = newDeadline;

  await admin.from('goals').update(updates).eq('id', goalId).eq('user_id', userId);
  return { success: true };
}
