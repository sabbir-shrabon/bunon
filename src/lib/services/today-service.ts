import 'server-only';
/**
 * 1. Purpose: Pure domain service for assembling the complete Today screen plan, persona, and banner state.
 * 2. Spec Ref: Database Schema v2.5 Section 5, Prompt Catalog Rule 6, & Category C Screens 22-37b.
 * 3. Called By: /api/today route handler and future MCP server tools.
 * 4. Calls: Admin Supabase client, goal-signals, step-slicer, today-evidence, and day-note-service.
 */

import { createAdminClient } from '@/lib/db/admin';
import { isUserProActive } from '@/lib/auth/entitlement';
import { loadGoalIntelligenceSignals } from '@/lib/ai/goal-signals';
import type { PersonaProfile } from '@/lib/ai/persona-engine';
import { sliceAdaptiveSteps, type StepSlicerResult } from '@/lib/ai/step-slicer';
import { getTodayDayNote } from './day-note-service';
import { evaluateContextBanner, type ContextBannerData, type ContextBannerType } from './context-banner-service';
import { fetchDoneTasksEvidenceMap } from './today-evidence';
import type { GoalRow, MilestoneRow, TaskRow } from '@/types/db/goal-tables';
import type { DayNoteRow } from '@/types/db/evidence-tables';
import type { HowToStepsData, SubStepItem } from '@/types/domain';
import type { ThreadTaskItem } from '@/components/today/types';

export type { ContextBannerData, ContextBannerType };

export interface TodayPlanResponse {
  hasActiveGoal: boolean;
  isPaused: boolean;
  isPro?: boolean;
  proUntil?: string | null;
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

  const [{ data: userGoals }, { data: userProfile }] = await Promise.all([
    admin
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['ACTIVE', 'DRAFT', 'PAUSED'])
      .order('created_at', { ascending: false }),
    admin.from('users').select('pro_until').eq('id', userId).maybeSingle(),
  ]);

  const proUntil = userProfile?.pro_until ?? null;
  const isPro = isUserProActive(proUntil);

  if (!userGoals || userGoals.length === 0) {
    return {
      hasActiveGoal: false, isPaused: false, isPro, proUntil, goals: [], activeGoal: null, currentMilestone: null,
      heroTask: null, heroTaskSteps: [], adaptiveSlice: null, remainingWeekTasks: [], threadTasks: [],
      activeTaskIndex: 0, isWeekDone: false, persona: null, banner: null, todayDayNote: null, streakText: null,
    };
  }

  const activeGoalRow =
    (requestedGoalId ? userGoals.find((g) => g.id === requestedGoalId) : null) ||
    userGoals.find((g) => g.status === 'ACTIVE') ||
    userGoals[0];
  const activeGoal = activeGoalRow as unknown as GoalRow;
  const isPaused = activeGoal.status === 'PAUSED';

  const goalSummariesPromise = Promise.all(
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

  const [goalSummaries, { data: weekTasks }, { data: allMilestones }, { data: rawDoneTasks }, signals, todayDayNote] =
    await Promise.all([
      goalSummariesPromise,
      admin
        .from('tasks')
        .select('*')
        .eq('goal_id', activeGoal.id)
        .eq('week_number', activeGoal.current_week_number)
        .order('sequence_order', { ascending: true }),
      admin.from('milestones').select('*').eq('goal_id', activeGoal.id),
      admin
        .from('tasks')
        .select('*')
        .eq('goal_id', activeGoal.id)
        .eq('status', 'DONE')
        .order('completed_at', { ascending: true }),
      loadGoalIntelligenceSignals({ supabaseAdmin: admin, goal: activeGoal }),
      getTodayDayNote(userId, activeGoal.id),
    ]);

  const tasks = (weekTasks || []) as unknown as TaskRow[];
  const doneTasks = (rawDoneTasks || []) as unknown as TaskRow[];
  const milestonesList = (allMilestones || []) as unknown as MilestoneRow[];
  const milestoneMap = new Map(milestonesList.map((m) => [m.id, m]));
  const evidenceMap = await fetchDoneTasksEvidenceMap(admin, doneTasks.map((t) => t.id));

  const pendingTasks = tasks
    .filter((t) => t.status === 'PENDING')
    .sort((a, b) => a.sequence_order - b.sequence_order);
  const heroTask = pendingTasks[0] || null;

  const threadTasks: ThreadTaskItem[] = [...doneTasks, ...pendingTasks].map((t) => {
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

  const milestone =
    (heroTask
      ? milestonesList.find((m) => m.id === heroTask.milestone_id)
      : milestonesList.find((m) => m.status === 'ACTIVE') || milestonesList[0]) || null;

  const rawSteps = (heroTask?.how_to_steps_json as unknown as HowToStepsData) || { steps: [] };
  const heroTaskSteps: SubStepItem[] = Array.isArray(rawSteps.steps) ? rawSteps.steps : [];

  let adaptiveSlice: StepSlicerResult | null = null;
  if (activeGoal.plan_style === 'DAILY_ADAPTIVE' && heroTaskSteps.length > 0) {
    const dailyBudget = Math.round((Number(activeGoal.hours_per_day) || 1) * 60);
    adaptiveSlice = sliceAdaptiveSteps(heroTaskSteps, dailyBudget);
  }

  const persona = signals.persona;
  const banner = evaluateContextBanner(activeGoal, persona, isWeekDone, milestone);
  const streakText = activeGoal.streak_weeks >= 2 ? `Streak: ${activeGoal.streak_weeks} weeks` : null;

  return {
    hasActiveGoal: true,
    isPaused,
    isPro,
    proUntil,
    goals: goalSummaries,
    activeGoal,
    currentMilestone: milestone,
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
