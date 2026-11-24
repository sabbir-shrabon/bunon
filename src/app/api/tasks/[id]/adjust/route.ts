/**
 * 1. Purpose: API route handler executing Pipeline 4 (Path-vs-Dose Daily Adjuster) with 0ms undo backup.
 * 2. Spec Ref: Prompt Catalog Pipeline 4 & Stitch Sheet 37b / Sheet 22b.
 * 3. Called By: Stuck Sheet 37b and WhyThisTask Sheet 22b.
 * 4. Calls: createClient, createAdminClient, firewall, assembler, and context-pack.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/db/server';
import { createAdminClient } from '@/lib/db/admin';
import { checkAIFirewall } from '@/lib/ai/firewall';
import { executeAIPipeline } from '@/lib/ai/assembler';
import { formatAIFirewallHttpError, guardApiRoute } from '@/lib/services/access-guard.service';
import { Pipeline4DailyAdjusterSchema, type Pipeline4Output } from '@/types/ai-schemas';
import { buildContextPack } from '@/lib/ai/context-pack';
import type { TaskRow, GoalRow } from '@/types/db/goal-tables';
import type { HowToStepsData, SubStepItem } from '@/types/domain';

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const guard = await guardApiRoute(user.id);
  if (!guard.ok) return guard.response;

  const { id: taskId } = await params;
  const body = (await request.json()) as {
    stuckReason: string;
    triggerType?: string;
  };

  const admin = createAdminClient();

  // 1. Fetch task and goal
  const { data: rawTask, error: taskError } = await admin
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (taskError || !rawTask) {
    return NextResponse.json({ error: 'TASK_NOT_FOUND' }, { status: 404 });
  }
  const task = rawTask as unknown as TaskRow;

  const { data: rawGoal, error: goalError } = await admin
    .from('goals')
    .select('*')
    .eq('id', task.goal_id)
    .single();

  if (goalError || !rawGoal) {
    return NextResponse.json({ error: 'GOAL_NOT_FOUND' }, { status: 404 });
  }
  const goal = rawGoal as unknown as GoalRow;

  if (goal.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // 2. Check 1 call per goal per day limit
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data: todayCalls } = await admin
    .from('ai_calls')
    .select('id')
    .eq('goal_id', goal.id)
    .eq('pipeline', 'PIPELINE_4')
    .gte('created_at', todayStart.toISOString())
    .limit(1);

  if (todayCalls && todayCalls.length >= 1) {
    if (body.stuckReason === 'TOO_TIRED' || body.stuckReason === 'NO_TIME') {
      await admin.from('tasks').update({ used_10m_version: true }).eq('id', taskId);
      return NextResponse.json({
        adjustment_needed: true,
        adaptation_action: 'SWAP',
        adaptation_reason: '10-minute version activated',
        used_10m_version: true,
      });
    }
    await admin.from('tasks').update({ marked_not_useful: true }).eq('id', taskId);
    return NextResponse.json({
      adjustment_needed: true,
      adaptation_action: 'NONE',
      adaptation_reason: 'Flagged for weekly review',
    });
  }

  // 3. AI Firewall Check
  const decision = await checkAIFirewall({
    userId: user.id,
    userIp: request.headers.get('x-forwarded-for'),
    pipeline: 'PIPELINE_4',
    goalId: goal.id,
  });

  if (!decision.allowed) {
    const formatted = formatAIFirewallHttpError(decision.reason, decision.retryAfterSeconds);
    return NextResponse.json(formatted.body, { status: formatted.status });
  }

  // 4. Fetch context and open tasks
  const { data: userRow } = await admin.from('users').select('person_memory_json, language').eq('id', user.id).single();
  const contextPack = buildContextPack(userRow?.person_memory_json, goal.journey_memory_json, goal.category);

  const { data: openTasks } = await admin
    .from('tasks')
    .select('id, title, estimate_minutes, how_to_steps_json, done_means')
    .eq('goal_id', goal.id)
    .in('status', ['PENDING', 'CARRIED'])
    .order('sequence_order', { ascending: true });

  const lang = userRow?.language === 'BN' ? 'BN' : 'EN';

  const variables = {
    language: lang,
    goal_title: goal.title,
    execution_mode: goal.execution_mode,
    plan_style: goal.plan_style,
    hours_per_day: goal.hours_per_day,
    trigger_type: body.triggerType || 'MAKE_IT_LIGHTER',
    stuck_reason: body.stuckReason,
    miss_cause: '',
    user_state: goal.user_state || 'STEADY',
    win_strategy_directive: 'Apply exact Path-vs-Dose lever.',
    behavior_signals_json: JSON.stringify({ stuck_reason: body.stuckReason }),
    day_note_text: '',
    target_task_json: JSON.stringify(task),
    remaining_week_open_tasks_json: JSON.stringify(openTasks || []),
    day_time_map_json: JSON.stringify(goal.day_time_map_json || {}),
    context_pack_json: JSON.stringify(contextPack),
  };

  const output = await executeAIPipeline<Pipeline4Output>(
    {
      pipeline: 'PIPELINE_4',
      userId: user.id,
      goalId: goal.id,
      model: decision.model,
      language: lang,
      category: goal.category,
      variables,
    },
    Pipeline4DailyAdjusterSchema
  );

  // 5. Apply task updates and preserve original_task_json for 0ms Undo
  if (output.updated_tasks && output.updated_tasks.length > 0) {
    for (const ut of output.updated_tasks) {
      const originalBackup = {
        title: task.title,
        estimate_minutes: task.estimate_minutes,
        done_means: task.done_means,
        how_to_steps_json: task.how_to_steps_json,
        min_version_10m: task.min_version_10m,
        why_it_matters: task.why_it_matters,
        used_context_ids: task.used_context_ids,
        adaptation_policy: task.adaptation_policy,
      };

      const mappedSteps: SubStepItem[] = ut.how_to_steps.steps.map((s) => ({
        step_number: s.step_number,
        text: s.text,
        minutes: s.minutes,
        done: false,
        done_at: null,
      }));

      const howToStepsJson: HowToStepsData = {
        steps: mappedSteps,
        example: ut.how_to_steps.example,
      };

      await admin
        .from('tasks')
        .update({
          title: ut.title,
          estimate_minutes: ut.estimate_minutes,
          done_means: ut.done_means,
          how_to_steps_json: howToStepsJson,
          min_version_10m: ut.min_version_10m,
          why_it_matters: ut.why_it_matters,
          used_context_ids: ut.used_context_ids,
          original_task_json: originalBackup as unknown as Record<string, unknown>,
          adaptation_reason: output.adaptation_reason || 'Paced lighter for today',
        })
        .eq('id', ut.task_id || taskId);
    }
  }

  if (output.today_context_line) {
    await admin
      .from('goals')
      .update({ today_context_line: output.today_context_line })
      .eq('id', goal.id);
  }

  return NextResponse.json(output);
}
