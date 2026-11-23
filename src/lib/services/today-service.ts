import 'server-only';
/**
 * 1. Purpose: Pure domain service for assembling the complete Today screen plan, persona, and banner state.
 * 2. Spec Ref: Database Schema v2.5 Section 5, Prompt Catalog Rule 6, & Category C Screens 22-37b.
 * 3. Called By: /api/today route handler and future MCP server tools.
 * 4. Calls: Admin Supabase client, persona-engine, step-slicer, and day-note-service.
 */

import { createAdminClient } from '@/lib/db/admin';
import { evaluatePersonaProfile, type PersonaProfile } from '@/lib/ai/persona-engine';
import { sliceAdaptiveSteps, type StepSlicerResult } from '@/lib/ai/step-slicer';
import { getTodayDayNote } from './day-note-service';
import { evaluateContextBanner, type ContextBannerData, type ContextBannerType } from './context-banner-service';
import type { GoalRow, MilestoneRow, TaskRow } from '@/types/db/goal-tables';
import type { DayNoteRow, EvidenceRow } from '@/types/db/evidence-tables';
import type { HowToStepsData, SubStepItem } from '@/types/domain';
import type { TaskEvidenceItem, ThreadTaskItem } from '@/components/today/types';

export type { ContextBannerData, ContextBannerType };

export interface TodayPlanResponse {
  hasActiveGoal: boolean;
  isPaused: boolean;
  goals: Array<{ id: string; title: string; category: string; pendingCount: number }>;
  activeGoal: GoalRow | null;
  currentMilestone: MilestoneRow | null;
  heroTask: TaskRow | null;
  heroTaskSteps: SubStepItem[];
  adaptiveSlice: StepSlicerResult | null;
  remainingWeekTasks: TaskRow[];
  threadTasks: ThreadTaskItem[];
  activeTaskIndex: number;
  isWeekDone: boolean;
  persona: PersonaProfile | null;
  banner: ContextBannerData | null;
  todayDayNote: DayNoteRow | null;
  streakText: string | null;
}

export async function getTodayPlan(
  userId: string,
  requestedGoalId?: string | null
): Promise<TodayPlanResponse> {
  const admin = createAdminClient();

  const { data: userGoals } = await admin
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['ACTIVE', 'DRAFT', 'PAUSED'])
    .order('created_at', { ascending: false });

  if (!userGoals || userGoals.length === 0) {
    return {
      hasActiveGoal: false, isPaused: false, goals: [], activeGoal: null, currentMilestone: null,
      heroTask: null, heroTaskSteps: [], adaptiveSlice: null, remainingWeekTasks: [], threadTasks: [],
      activeTaskIndex: 0, isWeekDone: false, persona: null, banner: null, todayDayNote: null, streakText: null,
    };
  }

  const activeGoal =
    (requestedGoalId ? userGoals.find((g) => g.id === requestedGoalId) : null) ||
    userGoals.find((g) => g.status === 'ACTIVE') ||
    userGoals[0];

  const isPaused = activeGoal.status === 'PAUSED';

  // 1. Fetch pending counts for all active goals
  const goalSummaries = await Promise.all(
    userGoals.map(async (g) => {
      const { count } = await admin
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('goal_id', g.id)
        .eq('week_number', g.current_week_number)
        .in('status', ['PENDING', 'CARRIED']);
      return { id: g.id, title: g.title, category: g.category, pendingCount: count || 0 };
    })
  );

  // 2. Fetch current week's tasks and milestone positions for active goal
  const { data: weekTasks } = await admin
    .from('tasks')
    .select('*')
    .eq('goal_id', activeGoal.id)
    .eq('week_number', activeGoal.current_week_number)
    .order('sequence_order', { ascending: true });

  const tasks = (weekTasks || []) as unknown as TaskRow[];

  const { data: allMilestones } = await admin
    .from('milestones')
    .select('id, position, title, expected_result, status')
    .eq('goal_id', activeGoal.id);

  const milestoneMap = new Map((allMilestones || []).map((m) => [m.id, m]));

  // 3. Fetch completed tasks (earlier + current weeks), ordered oldest -> newest
  const { data: rawDoneTasks } = await admin
    .from('tasks')
    .select('*')
    .eq('goal_id', activeGoal.id)
    .eq('status', 'DONE')
    .order('completed_at', { ascending: true });

  const doneTasks = (rawDoneTasks || []) as unknown as TaskRow[];

  // 4. Fetch evidence rows with 1-hour signed view URLs for all completed tasks
  const doneTaskIds = doneTasks.map((t) => t.id);
  const evidenceMap = new Map<string, TaskEvidenceItem[]>();

  if (doneTaskIds.length > 0) {
    const { data: rawEvidence } = await admin
      .from('evidence')
      .select('id, task_id, type, storage_path, external_url, caption_note, file_size_bytes, uploaded_at')
      .in('task_id', doneTaskIds)
      .order('uploaded_at', { ascending: false });

    if (rawEvidence && rawEvidence.length > 0) {
      const evidenceWithSigned = await Promise.all(
        rawEvidence.map(async (row) => {
          let signedUrl: string | null = null;
          if (row.storage_path) {
            const normalized = row.storage_path.replace(/^\/+/, '').replace(/^bunon-proofs\//, '');
            const { data: signed, error: signErr } = await admin.storage
              .from('bunon-proofs')
              .createSignedUrl(normalized, 3600);
            if (signErr) {
              console.error('[signed-url error]', { path: normalized, error: signErr });
            } else {
              signedUrl = signed?.signedUrl || null;
            }
          } else if (row.external_url) {
            signedUrl = row.external_url;
          }
          return {
            id: row.id,
            type: row.type,
            storage_path: row.storage_path,
            signed_url: signedUrl,
            external_url: row.external_url,
            caption_note: row.caption_note,
            file_size_bytes: Number(row.file_size_bytes) || 0,
            uploaded_at: row.uploaded_at,
            task_id: row.task_id,
          };
        })
      );

      evidenceWithSigned.forEach((ev) => {
        const list = evidenceMap.get(ev.task_id) || [];
        list.push(ev);
        evidenceMap.set(ev.task_id, list);
      });
    }
  }

  // 5. Active Hero task: strictly first PENDING task ordered by sequence_order ASC
  const pendingTasks = tasks
    .filter((t) => t.status === 'PENDING')
    .sort((a, b) => a.sequence_order - b.sequence_order);

  const heroTask = pendingTasks[0] || null;

  const combinedTasks = [...doneTasks, ...pendingTasks];
  const threadTasks: ThreadTaskItem[] = combinedTasks.map((t) => {
    const m = milestoneMap.get(t.milestone_id);
    return {
      ...t,
      milestone_position: m?.position || 1,
      milestone_title: m?.title || '',
      evidence: evidenceMap.get(t.id) || [],
    };
  });

  const firstPendingIndex = threadTasks.findIndex((t) => t.status === 'PENDING');
  const activeTaskIndex = firstPendingIndex >= 0 ? firstPendingIndex : Math.max(0, threadTasks.length - 1);

  const activeWeekTasks = tasks.filter((t) => t.status !== 'DROPPED');
  const isWeekDone =
    activeWeekTasks.length > 0 &&
    pendingTasks.length === 0 &&
    activeWeekTasks.every((t) => t.status === 'DONE' || t.status === 'SKIPPED_BASIC');

  const remainingWeekTasks = heroTask ? tasks.filter((t) => t.id !== heroTask.id) : tasks;

  // 6. Current milestone
  const { data: milestone } = heroTask
    ? await admin.from('milestones').select('*').eq('id', heroTask.milestone_id).maybeSingle()
    : await admin.from('milestones').select('*').eq('goal_id', activeGoal.id).eq('status', 'ACTIVE').maybeSingle();

  // 7. Persona profile & Adaptive Slice
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
  const { data: recentTasks } = await admin.from('tasks').select('*').eq('goal_id', activeGoal.id).gte('created_at', fourteenDaysAgo);
  const { data: recentEvidence } = await admin.from('evidence').select('*').eq('user_id', userId).order('uploaded_at', { ascending: false }).limit(10);

  const persona = evaluatePersonaProfile({
    scheduledWorkingDays: activeGoal.working_days || [0, 1, 2, 3, 4],
    lastActivityDate: activeGoal.last_activity_date,
    tasksLast14Days: (recentTasks || []) as unknown as TaskRow[],
    evidenceLast10: (recentEvidence || []) as unknown as EvidenceRow[],
  });

  const rawSteps = (heroTask?.how_to_steps_json as unknown as HowToStepsData) || { steps: [] };
  const heroTaskSteps: SubStepItem[] = Array.isArray(rawSteps.steps) ? rawSteps.steps : [];

  let adaptiveSlice: StepSlicerResult | null = null;
  if (activeGoal.plan_style === 'DAILY_ADAPTIVE' && heroTaskSteps.length > 0) {
    const dailyBudget = Math.round((Number(activeGoal.hours_per_day) || 1) * 60);
    adaptiveSlice = sliceAdaptiveSteps(heroTaskSteps, dailyBudget);
  }

  const banner = evaluateContextBanner(activeGoal, persona, isWeekDone, milestone as unknown as MilestoneRow | null);
  const todayDayNote = await getTodayDayNote(userId, activeGoal.id);

  let streakText: string | null = null;
  if (activeGoal.streak_weeks >= 2) {
    streakText = `Streak: ${activeGoal.streak_weeks} weeks`;
  }

  return {
    hasActiveGoal: true,
    isPaused,
    goals: goalSummaries,
    activeGoal: activeGoal as unknown as GoalRow,
    currentMilestone: milestone as unknown as MilestoneRow | null,
    heroTask,
    heroTaskSteps,
    adaptiveSlice,
    remainingWeekTasks,
    threadTasks,
    activeTaskIndex,
    isWeekDone,
    persona,
    banner,
    todayDayNote,
    streakText,
  };
}
