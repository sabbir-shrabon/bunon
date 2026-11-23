import 'server-only';
/**
 * 1. Purpose: Domain service for Journey Map roadmap operations, pause/resume, and goal lifecycle.
 * 2. Spec Ref: UI Design Guide Category E Screens 50-60 and Sheets 52-57.
 * 3. Called By: /roadmap, /api/goals/[id]/pause, /api/goals/[id]/resume, etc.
 * 4. Calls: Admin Supabase client and replan-service.
 */

import { createAdminClient } from '@/lib/db/admin';
import type { PlanStyle } from '@/types/domain';

export { replanGoal, applyReplan } from './replan-service';

interface EvidenceSummaryRow {
  id: string;
  milestone_id: string | null;
  file_path: string | null;
  caption: string | null;
  created_at: string;
}

export async function getRoadmapData(userId: string, targetGoalId?: string) {
  const admin = createAdminClient();

  let query = admin
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['ACTIVE', 'PAUSED', 'COMPLETED']);

  if (targetGoalId) {
    query = query.eq('id', targetGoalId);
  }

  const { data: goals } = await query.order('created_at', { ascending: false });
  const activeGoal = goals?.[0] || null;

  if (!activeGoal) return { goal: null, milestones: [], allGoals: [] };

  const { data: milestones } = await admin
    .from('milestones')
    .select('*')
    .eq('goal_id', activeGoal.id)
    .order('position', { ascending: true });

  const { data: goalTasks } = await admin
    .from('tasks')
    .select('id, milestone_id')
    .eq('goal_id', activeGoal.id);

  const taskToMilestoneMap = new Map((goalTasks || []).map((t) => [t.id, t.milestone_id]));

  const { data: rawProofs } = await admin
    .from('evidence')
    .select('id, task_id, storage_path, external_url, caption_note, uploaded_at')
    .eq('goal_id', activeGoal.id)
    .order('uploaded_at', { ascending: false });

  // Generate 1-hour signed view URLs for all proofs with storage_path
  const proofsWithSignedUrls = await Promise.all(
    (rawProofs || []).map(async (p) => {
      let signedUrl: string | null = null;
      if (p.storage_path) {
        const normalizedPath = p.storage_path.replace(/^\/+/, '').replace(/^bunon-proofs\//, '');
        const { data: signed, error: signErr } = await admin.storage
          .from('bunon-proofs')
          .createSignedUrl(normalizedPath, 3600);
        if (signErr) {
          console.error('[signed-url error]', { path: normalizedPath, error: signErr });
        } else {
          signedUrl = signed?.signedUrl || null;
        }
      } else if (p.external_url) {
        signedUrl = p.external_url;
      }

      return {
        ...p,
        signed_url: signedUrl,
      };
    })
  );

  const proofCountMap = new Map<string, number>();
  const milestoneProofsMap = new Map<
    string,
    Array<{
      id: string;
      file_path?: string;
      signed_url?: string;
      mediaUrl?: string;
      caption?: string;
      caption_note?: string;
      created_at: string;
    }>
  >();

  proofsWithSignedUrls.forEach((p) => {
    const milestoneId = taskToMilestoneMap.get(p.task_id);
    if (milestoneId) {
      proofCountMap.set(milestoneId, (proofCountMap.get(milestoneId) || 0) + 1);
      const list = milestoneProofsMap.get(milestoneId) || [];
      list.push({
        id: p.id,
        file_path: p.storage_path || p.external_url || undefined,
        signed_url: p.signed_url || undefined,
        mediaUrl: p.signed_url || undefined,
        caption: p.caption_note || undefined,
        caption_note: p.caption_note || undefined,
        created_at: p.uploaded_at,
      });
      milestoneProofsMap.set(milestoneId, list);
    }
  });

  const enrichedMilestones = (milestones || []).map((m) => ({
    ...m,
    proof_count: proofCountMap.get(m.id) || 0,
    proofs: milestoneProofsMap.get(m.id) || [],
  }));

  return {
    goal: activeGoal,
    milestones: enrichedMilestones,
    allGoals: (goals || []).map((g) => ({ id: g.id, title: g.title, status: g.status })),
  };
}

export async function switchPlanStyle(userId: string, goalId: string, planStyle: PlanStyle) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('goals')
    .update({ plan_style: planStyle })
    .eq('id', goalId)
    .eq('user_id', userId);
  if (error) throw error;
  return { success: true, planStyle };
}

export async function pauseGoal(userId: string, goalId: string, days: number, reason?: string) {
  const cappedDays = Math.min(Math.max(days, 1), 14);
  const admin = createAdminClient();

  const { data: goal } = await admin
    .from('goals')
    .select('deadline, total_paused_days')
    .eq('id', goalId)
    .eq('user_id', userId)
    .single();

  if (!goal) throw new Error('Goal not found');

  const oldDeadline = new Date(goal.deadline);
  oldDeadline.setDate(oldDeadline.getDate() + cappedDays);
  const newDeadline = oldDeadline.toISOString().slice(0, 10);

  const pausedUntil = new Date();
  pausedUntil.setDate(pausedUntil.getDate() + cappedDays);

  const { error } = await admin
    .from('goals')
    .update({
      status: 'PAUSED',
      paused_until: pausedUntil.toISOString().slice(0, 10),
      pause_reason: reason || null,
      deadline: newDeadline,
      total_paused_days: (goal.total_paused_days || 0) + cappedDays,
    })
    .eq('id', goalId)
    .eq('user_id', userId);

  if (error) throw error;
  return { success: true, newDeadline, pausedUntil: pausedUntil.toISOString().slice(0, 10) };
}

export async function resumeGoal(userId: string, goalId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('goals')
    .update({
      status: 'ACTIVE',
      paused_until: null,
      pause_reason: null,
    })
    .eq('id', goalId)
    .eq('user_id', userId);
  if (error) throw error;
  return { success: true };
}

export async function extendDeadline(userId: string, goalId: string, newDeadline: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('goals')
    .update({ deadline: newDeadline })
    .eq('id', goalId)
    .eq('user_id', userId);
  if (error) throw error;
  return { success: true, newDeadline };
}

export async function abandonGoal(userId: string, goalId: string, reason?: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('goals')
    .update({
      status: 'ABANDONED',
      abandon_reason: reason || null,
      closed_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .eq('user_id', userId);
  if (error) throw error;
  return { success: true };
}

export async function deleteGoal(userId: string, goalId: string, confirmName: string) {
  const admin = createAdminClient();
  const { data: goal } = await admin
    .from('goals')
    .select('title')
    .eq('id', goalId)
    .eq('user_id', userId)
    .single();

  if (!goal) throw new Error('Goal not found');
  if (goal.title.trim().toLowerCase() !== confirmName.trim().toLowerCase()) {
    throw new Error('Goal title does not match confirmation');
  }

  const { error } = await admin.from('goals').delete().eq('id', goalId).eq('user_id', userId);
  if (error) throw error;
  return { success: true };
}
