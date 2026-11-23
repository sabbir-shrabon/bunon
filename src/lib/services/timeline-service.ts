import 'server-only';
/**
 * 1. Purpose: Domain service for Timeline personal feed (Screen 61), month calendar heatmap, and proof editing.
 * 2. Spec Ref: UI Design Guide Category F Screens 61-68 and Stitch timeline_personal_journey_feed.
 * 3. Called By: /timeline, /api/timeline, /api/timeline/[id].
 * 4. Calls: Admin Supabase client and storage signed URL generator.
 */

import { createAdminClient } from '@/lib/db/admin';
import type { EvidenceVisibility } from '@/types/domain';

export interface TimelinePost {
  id: string;
  type: 'PROOF' | 'DAY_NOTE' | 'MILESTONE_REACHED';
  goalId: string;
  goalTitle: string;
  createdAt: string;
  dateStr: string;
  timestampStr: string;
  dayNumber: number;
  caption?: string;
  caption_note?: string;
  mediaUrl?: string | null;
  signed_url?: string | null;
  evidenceType?: string;
  taskTitle?: string;
  milestoneTitle?: string;
  milestonePosition?: number;
  visibility?: EvidenceVisibility;
}

export interface TimelineFilterOptions {
  goalId?: string;
  proofType?: 'ALL' | 'PHOTO' | 'LINK' | 'NOTE';
  monthStr?: string;
}

interface EvidenceTimelineRow {
  id: string;
  goal_id: string;
  user_id: string;
  task_id: string;
  type: string;
  storage_path: string | null;
  external_url: string | null;
  caption_note: string | null;
  visibility: EvidenceVisibility;
  uploaded_at: string;
}

interface DayNoteTimelineRow {
  id: string;
  goal_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export async function getTimelineFeed(
  userId: string,
  options?: TimelineFilterOptions
) {
  const admin = createAdminClient();

  // 1. Fetch Goals
  let goalQuery = admin
    .from('goals')
    .select('id, title, created_at, status')
    .eq('user_id', userId);

  if (options?.goalId) {
    goalQuery = goalQuery.eq('id', options.goalId);
  }

  const { data: goals } = await goalQuery;
  const goalMap = new Map((goals || []).map((g) => [g.id, g]));
  const goalIds = Array.from(goalMap.keys());

  if (goalIds.length === 0) return { posts: [], goals: [] };

  // 2. Fetch Evidence (Proofs)
  let proofQuery = admin
    .from('evidence')
    .select('id, goal_id, user_id, task_id, type, storage_path, external_url, file_size_bytes, duration_seconds, caption_note, visibility, uploaded_at')
    .in('goal_id', goalIds)
    .order('uploaded_at', { ascending: false });

  if (options?.proofType && options.proofType !== 'ALL') {
    proofQuery = proofQuery.eq('type', options.proofType);
  }

  const { data: rawEvidence } = await proofQuery;
  const evidenceRows = (rawEvidence || []) as unknown as EvidenceTimelineRow[];

  // Fetch associated tasks and milestones for rich metadata
  const { data: allTasks } = await admin
    .from('tasks')
    .select('id, title, week_number, milestone_id')
    .in('goal_id', goalIds);
  const taskMap = new Map((allTasks || []).map((t) => [t.id, t]));

  const { data: allMilestones } = await admin
    .from('milestones')
    .select('id, title, position')
    .in('goal_id', goalIds);
  const milestoneMap = new Map((allMilestones || []).map((m) => [m.id, m]));

  // 3. Generate 1-hour signed URLs for private proof media
  const proofsWithUrls = await Promise.all(
    evidenceRows.map(async (row) => {
      let signedUrl: string | null = null;
      if (row.storage_path) {
        const normalizedPath = row.storage_path.replace(/^\/+/, '').replace(/^bunon-proofs\//, '');
        const { data: signed, error: signErr } = await admin.storage
          .from('bunon-proofs')
          .createSignedUrl(normalizedPath, 3600);
        if (signErr) {
          console.error('[signed-url error]', { path: normalizedPath, error: signErr });
        } else {
          signedUrl = signed?.signedUrl || null;
        }
      } else if (row.external_url) {
        signedUrl = row.external_url;
      }

      const goal = goalMap.get(row.goal_id);
      const uploadedAt = new Date(row.uploaded_at);
      const start = goal ? new Date(goal.created_at) : uploadedAt;
      const dayNum = Math.max(1, Math.ceil((uploadedAt.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const task = taskMap.get(row.task_id);
      const milestone = task ? milestoneMap.get(task.milestone_id) : undefined;

      const post: TimelinePost = {
        id: row.id,
        type: 'PROOF',
        goalId: row.goal_id,
        goalTitle: goal?.title || '',
        createdAt: row.uploaded_at,
        dateStr: uploadedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestampStr: uploadedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        dayNumber: dayNum,
        caption: row.caption_note || '',
        caption_note: row.caption_note || '',
        mediaUrl: signedUrl,
        signed_url: signedUrl,
        evidenceType: row.type,
        taskTitle: task?.title || '',
        milestoneTitle: milestone?.title || '',
        milestonePosition: milestone?.position || 1,
        visibility: row.visibility || 'PRIVATE',
      };
      return post;
    })
  );

  // 4. Fetch Day Notes
  let dayNotePosts: TimelinePost[] = [];
  if (!options?.proofType || options.proofType === 'ALL' || options.proofType === 'NOTE') {
    const { data: rawNotes } = await admin
      .from('day_notes')
      .select('*')
      .in('goal_id', goalIds)
      .order('created_at', { ascending: false });

    const noteRows = (rawNotes || []) as unknown as DayNoteTimelineRow[];

    dayNotePosts = noteRows.map((row) => {
      const goal = goalMap.get(row.goal_id);
      const createdAt = new Date(row.created_at);
      const start = goal ? new Date(goal.created_at) : createdAt;
      const dayNum = Math.max(1, Math.ceil((createdAt.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

      const post: TimelinePost = {
        id: row.id,
        type: 'DAY_NOTE',
        goalId: row.goal_id,
        goalTitle: goal?.title || '',
        createdAt: row.created_at,
        dateStr: createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestampStr: createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        dayNumber: dayNum,
        caption: row.text || '',
      };
      return post;
    });
  }

  // 5. Fetch Milestone Reached Highlights
  const { data: doneMilestones } = await admin
    .from('milestones')
    .select('id, goal_id, title, position, reached_at')
    .in('goal_id', goalIds)
    .eq('status', 'DONE')
    .not('reached_at', 'is', null)
    .order('reached_at', { ascending: false });

  const milestonePosts: TimelinePost[] = (doneMilestones || []).map((m) => {
    const goal = goalMap.get(m.goal_id);
    const reachedAt = new Date(m.reached_at as string);
    const start = goal ? new Date(goal.created_at) : reachedAt;
    const dayNum = Math.max(1, Math.ceil((reachedAt.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      id: m.id,
      type: 'MILESTONE_REACHED',
      goalId: m.goal_id,
      goalTitle: goal?.title || '',
      createdAt: m.reached_at as string,
      dateStr: reachedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestampStr: reachedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      dayNumber: dayNum,
      milestoneTitle: m.title,
      milestonePosition: m.position,
    };
  });

  // Combine and sort chronologically descending
  const allPosts = [...proofsWithUrls, ...dayNotePosts, ...milestonePosts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    posts: allPosts,
    goals: (goals || []).map((g) => ({ id: g.id, title: g.title, status: g.status })),
  };
}

export async function getMonthActivity(
  userId: string,
  year?: number,
  month?: number,
  goalId?: string
) {
  const admin = createAdminClient();
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth() + 1;

  const startOfMonth = new Date(Date.UTC(targetYear, targetMonth - 1, 1)).toISOString();
  const endOfMonth = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59)).toISOString();

  let proofQ = admin
    .from('evidence')
    .select('uploaded_at, goal_id')
    .eq('user_id', userId)
    .gte('uploaded_at', startOfMonth)
    .lte('uploaded_at', endOfMonth);

  if (goalId) proofQ = proofQ.eq('goal_id', goalId);
  const { data: rawProofs } = await proofQ;
  const proofs = (rawProofs || []) as Array<{ uploaded_at: string; goal_id: string }>;

  let mileQ = admin
    .from('milestones')
    .select('reached_at, goal_id')
    .eq('status', 'DONE')
    .gte('reached_at', startOfMonth)
    .lte('reached_at', endOfMonth);

  if (goalId) mileQ = mileQ.eq('goal_id', goalId);
  const { data: rawReached } = await mileQ;
  const reached = (rawReached || []) as Array<{ reached_at: string | null; goal_id: string }>;

  const activityMap: Record<number, 'PROOF' | 'MILESTONE'> = {};
  proofs.forEach((p) => {
    const day = new Date(p.uploaded_at).getUTCDate();
    activityMap[day] = 'PROOF';
  });
  reached.forEach((m) => {
    if (m.reached_at) {
      const day = new Date(m.reached_at).getUTCDate();
      activityMap[day] = 'MILESTONE';
    }
  });

  return {
    year: targetYear,
    month: targetMonth,
    activeDaysCount: Object.keys(activityMap).length,
    activityMap,
  };
}

export async function updateTimelineProof(
  userId: string,
  evidenceId: string,
  updates: { caption?: string; visibility?: EvidenceVisibility }
) {
  const admin = createAdminClient();
  const dbUpdates: Record<string, unknown> = {};
  if (updates.caption !== undefined) {
    dbUpdates.caption_note = updates.caption;
  }
  if (updates.visibility !== undefined) {
    dbUpdates.visibility = updates.visibility;
  }
  const { error } = await admin
    .from('evidence')
    .update(dbUpdates)
    .eq('id', evidenceId)
    .eq('user_id', userId);
  if (error) throw error;
  return { success: true };
}
