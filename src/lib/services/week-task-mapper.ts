import 'server-only';
/**
 * 1. Purpose: Maps Pipeline 3 generated tasks into database insert payloads for Week N+1 rollover.
 * 2. Spec Ref: Database Schema v2.5 Table 6 (tasks) & Pipeline 3 output contract.
 * 3. Called By: src/lib/services/week-rollover-service.ts.
 * 4. Calls: Pure data transformation.
 */

import type { Pipeline3Output } from '@/types/ai-schemas';
import type { MilestoneRow } from '@/types/db/goal-tables';

export function buildNextWeekTaskInserts(
  goalId: string,
  nextWeekNumber: number,
  tasks: Pipeline3Output['tasks'],
  allMilestones: MilestoneRow[],
  activeMilestone: MilestoneRow
) {
  return tasks.map((t) => {
    const targetMilestone =
      allMilestones.find((m) => m.position === t.milestone_position) || activeMilestone;

    return {
      goal_id: goalId,
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
      status: 'PENDING' as const,
    };
  });
}
