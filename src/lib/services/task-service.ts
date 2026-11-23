import 'server-only';
/**
 * 1. Purpose: Pure domain service for task substeps, daily quota, skipping, undo, and completion reversal.
 * 2. Spec Ref: Database Schema v2.5 Section 5.2 Table 6 & Milestone 4 Task Loop.
 * 3. Called By: Task API routes and future MCP server tools.
 * 4. Calls: Admin Supabase client and domain types.
 */

import { createAdminClient } from '@/lib/db/admin';
import type { HowToStepsData, SubStepItem, TaskStatus } from '@/types/domain';
import type { TaskRow } from '@/types/db/goal-tables';

interface VerifiedTaskOwnership {
  task: TaskRow;
  goalId: string;
}

async function verifyTaskOwnership(userId: string, taskId: string): Promise<VerifiedTaskOwnership | null> {
  const admin = createAdminClient();
  const { data: task, error: taskErr } = await admin.from('tasks').select('*').eq('id', taskId).single();
  if (taskErr || !task) return null;

  const { data: goal, error: goalErr } = await admin.from('goals').select('user_id').eq('id', task.goal_id).single();
  if (goalErr || !goal || goal.user_id !== userId) return null;

  return { task: task as unknown as TaskRow, goalId: task.goal_id };
}

export async function tickSubstep(
  userId: string,
  taskId: string,
  stepNumber: number,
  done: boolean
): Promise<{ success: boolean; howToSteps?: HowToStepsData; error?: string }> {
  const ownership = await verifyTaskOwnership(userId, taskId);
  if (!ownership) return { success: false, error: 'TASK_NOT_FOUND' };

  const { task, goalId } = ownership;
  const rawSteps = (task.how_to_steps_json as unknown as HowToStepsData) || { steps: [], example: '' };
  const steps: SubStepItem[] = Array.isArray(rawSteps.steps) ? [...rawSteps.steps] : [];
  if (stepNumber === steps.length && done) return { success: false, error: 'FINAL_STEP_REQUIRES_PROOF' };

  const updatedSteps = steps.map((s) => (s.step_number === stepNumber ? { ...s, done, done_at: done ? new Date().toISOString() : null } : s));
  const updatedJson: HowToStepsData = { ...rawSteps, steps: updatedSteps };
  const admin = createAdminClient();
  const todayStr = new Date().toISOString().split('T')[0];

  const { error: updateError } = await admin.from('tasks').update({ how_to_steps_json: updatedJson }).eq('id', taskId);
  if (updateError) return { success: false, error: updateError.message };

  await admin.from('goals').update({ last_activity_date: todayStr }).eq('id', goalId);
  return { success: true, howToSteps: updatedJson };
}

export async function logDailyQuota(
  userId: string,
  taskId: string
): Promise<{ success: boolean; completedCount?: number; isDone?: boolean; error?: string }> {
  const ownership = await verifyTaskOwnership(userId, taskId);
  if (!ownership) return { success: false, error: 'TASK_NOT_FOUND' };

  const { task, goalId } = ownership;
  if (task.task_type !== 'DAILY_CORE' && task.task_type !== 'WEEKLY_QUOTA') return { success: false, error: 'NOT_QUOTA_TASK' };

  const todayStr = new Date().toISOString().split('T')[0];
  if (task.last_quota_logged_date === todayStr) return { success: false, error: 'ALREADY_LOGGED_TODAY' };

  const newCompletedCount = Math.min(task.target_count, (task.completed_count || 0) + 1);
  const isDone = newCompletedCount >= task.target_count;
  const admin = createAdminClient();
  const updatePayload: Partial<TaskRow> = { completed_count: newCompletedCount, last_quota_logged_date: todayStr };

  if (isDone) {
    updatePayload.status = 'DONE' as TaskStatus;
    updatePayload.completed_at = new Date().toISOString();
  }

  const { error: taskError } = await admin.from('tasks').update(updatePayload).eq('id', taskId);
  if (taskError) return { success: false, error: taskError.message };

  await admin.from('goals').update({ last_activity_date: todayStr }).eq('id', goalId);
  return { success: true, completedCount: newCompletedCount, isDone };
}

export async function skipTaskAsBasic(userId: string, taskId: string): Promise<{ success: boolean; error?: string }> {
  const ownership = await verifyTaskOwnership(userId, taskId);
  if (!ownership) return { success: false, error: 'TASK_NOT_FOUND' };

  const admin = createAdminClient();
  const todayStr = new Date().toISOString().split('T')[0];
  const { error } = await admin.from('tasks').update({ status: 'SKIPPED_BASIC' as TaskStatus, skip_reason: 'TOO_BASIC' }).eq('id', taskId);
  if (error) return { success: false, error: error.message };

  await admin.from('goals').update({ last_activity_date: todayStr }).eq('id', ownership.goalId);
  return { success: true };
}

export async function undoTaskAdjustment(
  userId: string,
  taskId: string
): Promise<{ success: boolean; restoredTask?: TaskRow; error?: string }> {
  const ownership = await verifyTaskOwnership(userId, taskId);
  if (!ownership) return { success: false, error: 'TASK_NOT_FOUND' };

  const { task } = ownership;
  if (!task.original_task_json) return { success: false, error: 'NO_ORIGINAL_TASK' };

  const original = task.original_task_json as Partial<TaskRow>;
  const admin = createAdminClient();
  const restorePayload = {
    title: original.title ?? task.title,
    estimate_minutes: original.estimate_minutes ?? task.estimate_minutes,
    done_means: original.done_means ?? task.done_means,
    how_to_steps_json: original.how_to_steps_json ?? task.how_to_steps_json,
    min_version_10m: original.min_version_10m ?? task.min_version_10m,
    why_it_matters: original.why_it_matters ?? task.why_it_matters,
    used_context_ids: original.used_context_ids ?? task.used_context_ids,
    adaptation_policy: original.adaptation_policy ?? task.adaptation_policy,
    original_task_json: null,
    adaptation_reason: null,
  };

  const { data: updated, error } = await admin.from('tasks').update(restorePayload).eq('id', taskId).select().single();
  if (error) return { success: false, error: error.message };

  return { success: true, restoredTask: updated as unknown as TaskRow };
}

export async function toggle10MinuteVersion(
  userId: string,
  taskId: string,
  active: boolean
): Promise<{ success: boolean; used10mVersion: boolean; error?: string }> {
  const ownership = await verifyTaskOwnership(userId, taskId);
  if (!ownership) return { success: false, used10mVersion: false, error: 'TASK_NOT_FOUND' };

  const admin = createAdminClient();
  const { error } = await admin.from('tasks').update({ used_10m_version: active }).eq('id', taskId);
  if (error) return { success: false, used10mVersion: !active, error: error.message };

  return { success: true, used10mVersion: active };
}

export async function undoTaskCompletion(
  userId: string,
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  const ownership = await verifyTaskOwnership(userId, taskId);
  if (!ownership) return { success: false, error: 'TASK_NOT_FOUND' };

  const { task } = ownership;
  const admin = createAdminClient();

  // 1. Fetch attached evidence
  const { data: evidenceRows } = await admin
    .from('evidence')
    .select('id, storage_path, file_size_bytes')
    .eq('task_id', taskId);

  if (evidenceRows && evidenceRows.length > 0) {
    // 2. Remove files from Supabase Storage
    const storagePaths = evidenceRows
      .map((r) => r.storage_path?.replace(/^\/+/, '').replace(/^bunon-proofs\//, ''))
      .filter((p): p is string => Boolean(p));

    if (storagePaths.length > 0) {
      await admin.storage.from('bunon-proofs').remove(storagePaths);
    }

    // 3. Decrement user storage usage
    const totalBytes = evidenceRows.reduce((acc, r) => acc + (Number(r.file_size_bytes) || 0), 0);
    if (totalBytes > 0) {
      const { data: user } = await admin.from('users').select('storage_used_bytes').eq('id', userId).single();
      const currentBytes = Number(user?.storage_used_bytes) || 0;
      await admin.from('users').update({ storage_used_bytes: Math.max(0, currentBytes - totalBytes) }).eq('id', userId);
    }

    // 4. Delete evidence rows
    await admin.from('evidence').delete().eq('task_id', taskId);
  }

  // 5. Reset task status
  const { error: resetErr } = await admin
    .from('tasks')
    .update({
      status: 'PENDING' as TaskStatus,
      completed_at: null,
      effort_rating: null,
      effort_rated_at: null,
    })
    .eq('id', taskId);

  if (resetErr) return { success: false, error: resetErr.message };

  // 6. Reset milestone if it was marked DONE
  if (task.milestone_id) {
    const { data: m } = await admin.from('milestones').select('status').eq('id', task.milestone_id).single();
    if (m?.status === 'DONE') {
      await admin.from('milestones').update({ status: 'ACTIVE', reached_at: null }).eq('id', task.milestone_id);
    }
  }

  return { success: true };
}
