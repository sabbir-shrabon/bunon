import 'server-only';
/**
 * 1. Purpose: Pure domain service for proof uploads, quota/limits enforcement, and task completion.
 * 2. Spec Ref: Database Schema v2.5 Section 4 & Category D Proof Screens 39-49.
 * 3. Called By: Evidence upload and complete API routes and MCP server.
 * 4. Calls: Admin Supabase client and storage.
 */

import { createAdminClient } from '@/lib/db/admin';
import { safeExternalUrl } from '@/lib/security';
import type { EvidenceType, TaskStatus } from '@/types/domain';
import type { TaskRow } from '@/types/db/goal-tables';
import type { EvidenceRow } from '@/types/db/evidence-tables';

export interface ProofUploadUrlRequest {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  durationSeconds?: number;
  type?: EvidenceType;
  proofType?: EvidenceType;
}

export interface ProofUploadUrlResult {
  success: boolean;
  signedUrl?: string;
  storagePath?: string;
  path?: string;
  token?: string;
  error?: 'TASK_NOT_FOUND' | 'PRO_REQUIRED' | 'DAILY_PHOTO_LIMIT' | 'FILE_TOO_LARGE' | 'STORAGE_FULL' | string;
}

export async function requestProofUploadUrl(
  userId: string,
  taskId: string,
  req: ProofUploadUrlRequest
): Promise<ProofUploadUrlResult> {
  const admin = createAdminClient();

  // 1. Verify task ownership
  const { data: task, error: taskError } = await admin
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (taskError || !task) return { success: false, error: 'TASK_NOT_FOUND' };

  const { data: goal, error: goalErr } = await admin
    .from('goals')
    .select('user_id')
    .eq('id', task.goal_id)
    .single();

  if (goalErr || !goal || goal.user_id !== userId) return { success: false, error: 'TASK_NOT_FOUND' };

  // 2. Fetch user pro status & storage usage
  const { data: user, error: userError } = await admin
    .from('users')
    .select('pro_until, storage_used_bytes')
    .eq('id', userId)
    .single();

  if (userError || !user) return { success: false, error: 'USER_NOT_FOUND' };

  const isPro = Boolean(user.pro_until && new Date(user.pro_until) > new Date());
  const resolvedType = req.type || req.proofType || 'PHOTO';

  // 3. Pro-locked features check (Video and File/PDF require Pro)
  if (!isPro && (resolvedType === 'VIDEO' || resolvedType === 'FILE')) {
    return { success: false, error: 'PRO_REQUIRED' };
  }

  // 4. Free user 1-photo per day limit check
  if (!isPro && resolvedType === 'PHOTO') {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { data: todayPhotos } = await admin
      .from('evidence')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'PHOTO')
      .gte('uploaded_at', todayStart.toISOString())
      .limit(1);

    if (todayPhotos && todayPhotos.length >= 1) {
      return { success: false, error: 'DAILY_PHOTO_LIMIT' };
    }
  }

  // 5. Single-file cap: 10 MB default
  const maxFileBytes = 10 * 1024 * 1024;
  if (req.fileSizeBytes > maxFileBytes) {
    return { success: false, error: 'FILE_TOO_LARGE' };
  }

  // 6. Total Storage Quota (50 MB Free / 2 GB Pro)
  const quotaBytes = isPro ? 2 * 1024 * 1024 * 1024 : 50 * 1024 * 1024;
  const currentBytes = Number(user.storage_used_bytes) || 0;
  if (currentBytes + req.fileSizeBytes > quotaBytes) {
    return { success: false, error: 'STORAGE_FULL' };
  }

  // 7. Generate 60-Second Signed Upload URL
  let ext = 'jpg';
  if (req.fileName && req.fileName.includes('.')) {
    const rawExt = req.fileName.split('.').pop()?.toLowerCase();
    if (rawExt && /^[a-z0-9]+$/.test(rawExt)) {
      ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
    }
  } else if (req.mimeType) {
    const sub = req.mimeType.split('/')[1]?.toLowerCase();
    if (sub) {
      ext = sub === 'jpeg' ? 'jpg' : sub.replace(/[^a-z0-9]/g, '') || 'jpg';
    }
  }
  const uniqueId = crypto.randomUUID();
  const path = `users/${userId}/goals/${task.goal_id}/${uniqueId}.${ext}`;

  try {
    let { data: signedData, error: signError } = await admin.storage
      .from('bunon-proofs')
      .createSignedUploadUrl(path);

    if (
      signError &&
      (signError.message?.toLowerCase().includes('not found') ||
        signError.message?.toLowerCase().includes('bucket') ||
        (signError as { statusCode?: string }).statusCode === '404')
    ) {
      // Safe one-time fallback: create bucket if not found and retry
      await admin.storage.createBucket('bunon-proofs', { public: false }).catch(() => null);
      const retryResult = await admin.storage
        .from('bunon-proofs')
        .createSignedUploadUrl(path);
      signedData = retryResult.data;
      signError = retryResult.error;
    }

    if (signError) {
      return { success: false, error: signError.message };
    }

    return {
      success: true,
      signedUrl: signedData?.signedUrl,
      path,
      storagePath: path,
      token: signedData?.token,
    };
  } catch (err) {
    try {
      await admin.storage.createBucket('bunon-proofs', { public: false }).catch(() => null);
      const retryResult = await admin.storage
        .from('bunon-proofs')
        .createSignedUploadUrl(path);
      if (retryResult.data?.signedUrl) {
        return {
          success: true,
          signedUrl: retryResult.data.signedUrl,
          path,
          storagePath: path,
          token: retryResult.data.token,
        };
      }
    } catch {
      // ignore fallback error
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'STORAGE_ERROR',
    };
  }
}

export interface CompleteTaskPayload {
  type: EvidenceType;
  storagePath?: string;
  externalUrl?: string;
  fileSizeBytes?: number;
  durationSeconds?: number;
  captionNote?: string;
  effortRating?: string;
  measuredValue?: number;
  used_10m_version?: boolean;
  used10mVersion?: boolean;
}

export interface CompleteTaskResult {
  success: boolean;
  taskId?: string;
  weekCompleted?: boolean;
  isWeekCompleted?: boolean;
  allMilestonesDone?: boolean;
  nextTaskId?: string | null;
  evidence?: EvidenceRow;
  error?: string;
}

export async function completeTaskWithEvidence(
  userId: string,
  taskId: string,
  payload: CompleteTaskPayload
): Promise<CompleteTaskResult> {
  const admin = createAdminClient();

  const { data: task, error: taskError } = await admin
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (taskError || !task) return { success: false, error: 'TASK_NOT_FOUND' };

  const { data: goal, error: goalErr } = await admin
    .from('goals')
    .select('user_id, current_week_number')
    .eq('id', task.goal_id)
    .single();

  if (goalErr || !goal || goal.user_id !== userId) return { success: false, error: 'TASK_NOT_FOUND' };

  const todayStr = new Date().toISOString().split('T')[0];
  const nowStr = new Date().toISOString();

  // 1. Validate & sanitize storage_path for PHOTO proof
  let cleanStoragePath: string | null = null;
  if (payload.type === 'PHOTO') {
    if (!payload.storagePath || typeof payload.storagePath !== 'string') {
      return { success: false, error: 'PHOTO_STORAGE_PATH_REQUIRED' };
    }
    if (payload.storagePath.startsWith('blob:')) {
      return { success: false, error: 'INVALID_STORAGE_PATH_BLOB_NOT_ALLOWED' };
    }

    let normalized = payload.storagePath.trim().replace(/^\/+/, '');
    if (normalized.startsWith('bunon-proofs/')) {
      normalized = normalized.slice('bunon-proofs/'.length);
    }
    normalized = normalized.replace(/^\/+/, '');

    const expectedPrefix = `users/${userId}/goals/${task.goal_id}/`;
    if (!normalized.startsWith(expectedPrefix)) {
      console.error('[storage_path prefix mismatch]', { normalized, expectedPrefix });
      return { success: false, error: 'STORAGE_PATH_PREFIX_MISMATCH' };
    }

    const fileName = normalized.slice(expectedPrefix.length);
    if (!/^[0-9a-fA-F-]+\.[a-zA-Z0-9]+$/.test(fileName)) {
      console.error('[invalid storage_path fileName format]', { fileName });
      return { success: false, error: 'INVALID_STORAGE_PATH_FORMAT' };
    }

    // Verify the uploaded object exists in bunon-proofs
    const { data: existsData, error: existsErr } = await admin.storage
      .from('bunon-proofs')
      .exists(normalized);

    if (existsErr || !existsData) {
      console.error('[storage photo existence check failed]', { path: normalized, existsErr, existsData });
      return { success: false, error: 'PHOTO_NOT_FOUND_IN_STORAGE' };
    }

    cleanStoragePath = normalized;
  } else if (payload.storagePath) {
    let normalized = payload.storagePath.trim().replace(/^\/+/, '');
    if (normalized.startsWith('bunon-proofs/')) {
      normalized = normalized.slice('bunon-proofs/'.length);
    }
    cleanStoragePath = normalized.replace(/^\/+/, '');
  }

  // Validate external proof link if provided
  const cleanExternalUrl = payload.externalUrl ? safeExternalUrl(payload.externalUrl) : null;
  if (payload.type === 'LINK' && !cleanExternalUrl) {
    return { success: false, error: 'INVALID_EXTERNAL_URL: Link must start strictly with http:// or https://' };
  }

  // 2. Insert Evidence row
  const { data: evidence, error: evError } = await admin
    .from('evidence')
    .insert({
      task_id: taskId,
      goal_id: task.goal_id,
      user_id: userId,
      type: payload.type,
      storage_path: cleanStoragePath,
      external_url: cleanExternalUrl,
      file_size_bytes: payload.fileSizeBytes || 0,
      duration_seconds: payload.durationSeconds || null,
      caption_note: payload.captionNote || null,
      measured_value: payload.measuredValue || null,
      visibility: 'PRIVATE',
      uploaded_at: nowStr,
    })
    .select()
    .single();

  if (evError) return { success: false, error: evError.message };

  // Generate 1-hour signed URL for the returned evidence record if photo
  let evidenceWithSignedUrl = evidence as unknown as EvidenceRow & { signed_url?: string | null };
  if (cleanStoragePath) {
    const { data: signed, error: signErr } = await admin.storage
      .from('bunon-proofs')
      .createSignedUrl(cleanStoragePath, 3600);
    if (signErr) {
      console.error('[signed-url error]', { path: cleanStoragePath, error: signErr });
    } else if (signed?.signedUrl) {
      evidenceWithSignedUrl = {
        ...evidenceWithSignedUrl,
        signed_url: signed.signedUrl,
      };
    }
  }

  // 2. Mark task as DONE
  const is10m = Boolean(payload.used_10m_version ?? payload.used10mVersion ?? false);
  const { error: updateTaskErr } = await admin
    .from('tasks')
    .update({
      status: 'DONE' as TaskStatus,
      completed_at: nowStr,
      effort_rating: payload.effortRating || null,
      effort_rated_at: payload.effortRating ? nowStr : null,
      used_10m_version: is10m,
    })
    .eq('id', taskId);

  if (updateTaskErr) return { success: false, error: updateTaskErr.message };

  // 3. Update storage bytes and photo limits on user
  const { data: usr } = await admin
    .from('users')
    .select('storage_used_bytes, daily_photo_date, daily_photo_count')
    .eq('id', userId)
    .single();

  const userUpdates: Record<string, unknown> = {};
  if (payload.fileSizeBytes && payload.fileSizeBytes > 0) {
    const curBytes = Number(usr?.storage_used_bytes) || 0;
    userUpdates.storage_used_bytes = curBytes + payload.fileSizeBytes;
  }
  if (payload.type === 'PHOTO') {
    const isSameDay = usr?.daily_photo_date === todayStr;
    userUpdates.daily_photo_date = todayStr;
    userUpdates.daily_photo_count = isSameDay ? (Number(usr?.daily_photo_count) || 0) + 1 : 1;
  }
  if (Object.keys(userUpdates).length > 0) {
    await admin.from('users').update(userUpdates).eq('id', userId);
  }

  // 4. Update goal last_activity_date
  await admin
    .from('goals')
    .update({ last_activity_date: todayStr })
    .eq('id', task.goal_id);

  // 5. Update milestone if all tasks for this milestone are now done
  if (task.milestone_id) {
    const { data: mTasks } = await admin
      .from('tasks')
      .select('status')
      .eq('milestone_id', task.milestone_id);
    const activeMilestoneTasks = (mTasks || []).filter((t) => t.status !== 'DROPPED');
    if (
      activeMilestoneTasks.length > 0 &&
      activeMilestoneTasks.every((t) => t.status === 'DONE' || t.status === 'SKIPPED_BASIC')
    ) {
      await admin
        .from('milestones')
        .update({ status: 'DONE', reached_at: nowStr })
        .eq('id', task.milestone_id);
    }
  }

  // 6. Check if all milestones are completed
  const { data: allMilestones } = await admin
    .from('milestones')
    .select('status')
    .eq('goal_id', task.goal_id);
  const allMilestonesDone =
    (allMilestones || []).length > 0 &&
    (allMilestones || []).every((m) => m.status === 'DONE');

  // 7. Check if all tasks in current week are completed
  const currentWeek = task.week_number;
  const { data: weekTasks } = await admin
    .from('tasks')
    .select('id, sequence_order, status')
    .eq('goal_id', task.goal_id)
    .eq('week_number', currentWeek)
    .order('sequence_order', { ascending: true });

  const activeWeekTasks = (weekTasks || []).filter((t) => t.status !== 'DROPPED');
  const isWeekCompleted =
    activeWeekTasks.length > 0 &&
    activeWeekTasks.every((t) => t.status === 'DONE' || t.status === 'SKIPPED_BASIC');

  // 8. Find next pending task
  const nextInWeek = activeWeekTasks.find((t) => t.status === 'PENDING' && t.id !== taskId);
  let nextTaskId = nextInWeek?.id || null;
  if (!nextTaskId) {
    const { data: nextGoalTask } = await admin
      .from('tasks')
      .select('id')
      .eq('goal_id', task.goal_id)
      .eq('status', 'PENDING')
      .order('sequence_order', { ascending: true })
      .limit(1)
      .maybeSingle();
    nextTaskId = nextGoalTask?.id || null;
  }

  return {
    success: true,
    taskId,
    weekCompleted: isWeekCompleted,
    isWeekCompleted,
    allMilestonesDone,
    nextTaskId,
    evidence: evidenceWithSignedUrl as unknown as EvidenceRow,
  };
}
