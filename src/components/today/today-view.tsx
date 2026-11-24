/**
 * 1. Purpose: Client orchestrator for Today Screen 22 with 3-Slot Fluid Morph Deck & 2-Stage Choreography.
 * 2. Spec Ref: Stitch today_cleanest_2_beat_thread Screen 22 & 3-Slot Morph Deck Contract.
 * 3. Called By: /today page.
 * 4. Calls: AppShell, MorphDeck, AllDoneView, UndoCompleteSheet, and dialog sheets.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/shell/app-shell';
import { GuestEntry } from '@/components/today/guest-entry';
import { MorphDeck } from '@/components/today/morph-deck';
import { ContextCardSlot } from '@/components/today/context-cards';
import { AllDoneView } from '@/components/today/all-done-view';
import { WhyThisTaskSheet } from '@/components/today/why-this-task-sheet';
import { StuckSheet } from '@/components/today/stuck-sheet';
import { DayNoteSheet } from '@/components/today/day-note-sheet';
import { GoalSwitcherSheet } from '@/components/today/goal-switcher-sheet';
import { ThisWeekPlanModal } from '@/components/today/this-week-plan-modal';
import { UndoCompleteSheet } from '@/components/today/undo-complete-sheet';
import { runTwoStepWeekAdvance, requestTaskScheduleAdjust } from '@/components/today/week-advance-api';
import type { TodayPlanResponse } from '@/lib/services/today-service';
import type { ThreadTaskItem } from '@/components/today/types';
import type { SubStepItem } from '@/types/domain';

export function TodayView({ initialData }: Readonly<{ initialData: TodayPlanResponse }>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<TodayPlanResponse>(initialData);
  const [focusedIndex, setFocusedIndex] = useState<number>(initialData.activeTaskIndex || 0);
  const [completedToast, setCompletedToast] = useState<string | null>(null);

  const [undoTask, setUndoTask] = useState<ThreadTaskItem | null>(null);
  const [isWhyOpen, setIsWhyOpen] = useState(false);
  const [isStuckOpen, setIsStuckOpen] = useState(false);
  const [isDayNoteOpen, setIsDayNoteOpen] = useState(false);
  const [isGoalSwitcherOpen, setIsGoalSwitcherOpen] = useState(false);
  const [isWeekPlanOpen, setIsWeekPlanOpen] = useState(false);
  const [isAdvancingWeek, setIsAdvancingWeek] = useState(false);
  const [advanceStepLabel, setAdvanceStepLabel] = useState<string | null>(null);
  const [advanceWeekError, setAdvanceWeekError] = useState<string | null>(null);

  useEffect(() => {
    setData(initialData);
    setFocusedIndex(initialData.activeTaskIndex || 0);
  }, [initialData]);

  // 2-Stage Completion Choreography on return from /proof/create
  const completedTaskId = searchParams.get('completed');
  useEffect(() => {
    if (completedTaskId && data.threadTasks.length > 0) {
      const foundIdx = data.threadTasks.findIndex((t) => t.id === completedTaskId);
      if (foundIdx >= 0) {
        setFocusedIndex(foundIdx);
        setCompletedToast('Proof saved · Task marked done!');
        const timer = setTimeout(() => { setFocusedIndex(data.activeTaskIndex); router.replace('/today'); }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [completedTaskId, data.threadTasks, data.activeTaskIndex, router]);

  if (!data.hasActiveGoal || !data.activeGoal) return <GuestEntry />;

  const reloadPlan = async (goalId?: string) => {
    const targetId = goalId || data.activeGoal?.id;
    const res = await fetch(targetId ? `/api/today?goalId=${targetId}` : '/api/today');
    if (res.ok) {
      const updated: TodayPlanResponse = await res.json();
      setData(updated);
      setFocusedIndex(updated.activeTaskIndex || 0);
    }
  };

  const handleToggleSubstep = async (stepNumber: number, done: boolean) => {
    const activeTask = data.threadTasks[focusedIndex] || data.heroTask;
    if (!activeTask) return;
    const res = await fetch(`/api/tasks/${activeTask.id}/substeps`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepNumber, done }),
    });
    if (res.ok) {
      const resJson = await res.json();
      if (resJson.howToSteps?.steps) setData((prev) => ({ ...prev, heroTaskSteps: resJson.howToSteps.steps as SubStepItem[] }));
    }
  };

  const handleToggle10Min = async (active: boolean) => {
    const activeTask = data.threadTasks[focusedIndex] || data.heroTask;
    if (!activeTask) return;
    const res = await fetch(`/api/tasks/${activeTask.id}/ten-min`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    });
    if (res.ok) {
      setData((prev) => ({
        ...prev,
        threadTasks: prev.threadTasks.map((t) => (t.id === activeTask.id ? { ...t, used_10m_version: active } : t)),
      }));
    }
  };

  const handleSkipBasic = async () => {
    const activeTask = data.threadTasks[focusedIndex] || data.heroTask;
    if (activeTask && (await fetch(`/api/tasks/${activeTask.id}/skip`, { method: 'POST' })).ok) await reloadPlan();
  };

  const handleUndoAdjustment = async () => {
    const activeTask = data.threadTasks[focusedIndex] || data.heroTask;
    if (activeTask && (await fetch(`/api/tasks/${activeTask.id}/undo`, { method: 'POST' })).ok) await reloadPlan();
  };

  const handleAdjustSchedule = async (reason: string) => {
    const activeTask = data.threadTasks[focusedIndex] || data.heroTask;
    if (!activeTask) return;
    await requestTaskScheduleAdjust(activeTask.id, reason);
    await reloadPlan();
  };

  const handleAdvanceWeek = async () => {
    if (!data.activeGoal || isAdvancingWeek) return;
    setIsAdvancingWeek(true);
    setAdvanceWeekError(null);
    const activeWeek = data.activeGoal.current_week_number;
    try {
      const result = await runTwoStepWeekAdvance(data.activeGoal.id, activeWeek, setAdvanceStepLabel);
      if (result.isGoalCompleted && result.journeyCardSlug) {
        router.push(`/journey/${result.journeyCardSlug}`);
      } else if (result.weeklyReviewId) {
        router.push(`/weekly-summary/${result.weeklyReviewId}`);
      } else {
        await reloadPlan();
        router.refresh();
      }
    } catch (err) {
      setAdvanceWeekError(
        err instanceof Error
          ? err.message
          : "We could not build next week's plan just now. Your progress is safe — please tap to try again."
      );
    } finally {
      setIsAdvancingWeek(false);
      setAdvanceStepLabel(null);
    }
  };

  const handleNavigateToProof = () => {
    const activeTask = data.threadTasks[focusedIndex] || data.heroTask;
    if (activeTask) router.push(`/proof/create?taskId=${activeTask.id}`);
  };

  const currentWeek = data.activeGoal.current_week_number;
  const currentDayInWeek = Math.max(1, new Date().getDay() + 1);
  const isAnyModalOpen = isWhyOpen || isStuckOpen || isDayNoteOpen || isGoalSwitcherOpen || isWeekPlanOpen || Boolean(undoTask);
  const focusedTask = data.threadTasks[focusedIndex] || data.heroTask;

  return (
    <AppShell>
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-[var(--page)]">
        <div className="flex flex-col w-full max-w-[428px] md:max-w-[640px] mx-auto px-4 pt-3 pb-8">
          {/* Header Row */}
          <div className="flex justify-between items-center mb-3 px-1 text-muted text-[13px] font-medium">
            <button type="button" onClick={() => setIsGoalSwitcherOpen(true)} className="flex items-center gap-1 text-ink hover:text-muted transition-colors cursor-pointer">
              <span>{data.activeGoal.title}</span>
              <span className="text-[14px]">▾</span>
            </button>
            <span className="text-muted text-[12px]">Week {currentWeek} · Day {currentDayInWeek}</span>
          </div>

          {/* Toast */}
          {completedToast && (
            <div role="status" className="mb-3 px-4 py-2.5 rounded-2xl bg-[#FFB020]/15 border border-[#FFB020]/30 text-ink flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-5 h-5 rounded-full bg-[#FFB020] text-white flex items-center justify-center text-[11px] font-bold shrink-0">✓</div>
                <span className="text-[13px] font-semibold truncate">{completedToast}</span>
              </div>
              <button type="button" aria-label="Dismiss notification" onClick={() => setCompletedToast(null)} className="text-muted hover:text-ink text-[12px] px-1 font-medium cursor-pointer shrink-0">✕</button>
            </div>
          )}

          {/* Contextual Banner Slot */}
          <ContextCardSlot banner={data.banner} onOpenWeekPlan={() => setIsWeekPlanOpen(true)} onSelectMissCause={handleAdjustSchedule} />

          {/* 3-Slot Fluid Morph Deck */}
          {data.threadTasks.length > 0 ? (
            <div className="flex flex-col gap-4">
              <MorphDeck
                threadTasks={data.threadTasks}
                focusedIndex={focusedIndex}
                activeTaskIndex={data.activeTaskIndex}
                setFocusedIndex={setFocusedIndex}
                heroTaskSteps={data.heroTaskSteps}
                currentMilestone={data.currentMilestone}
                adaptiveSlice={data.adaptiveSlice}
                planStyle={data.activeGoal.plan_style}
                isAnyModalOpen={isAnyModalOpen}
                onOpenWhyThisTask={() => setIsWhyOpen(true)}
                onOpenStuckSheet={() => setIsStuckOpen(true)}
                onToggleSubstep={handleToggleSubstep}
                onToggle10Min={handleToggle10Min}
                onUndoAdjustment={handleUndoAdjustment}
                onCameraClick={handleNavigateToProof}
                onNoteLinkClick={handleNavigateToProof}
                onMarkTaskNotDone={(task) => setUndoTask(task)}
              />

              {data.isWeekDone && (
                <div className="pt-2">
                  <AllDoneView isWeekQueueDone={true} weekNumber={currentWeek} onOpenDayNote={() => setIsDayNoteOpen(true)} onAdvanceWeek={handleAdvanceWeek} isAdvancingWeek={isAdvancingWeek} advanceStepLabel={advanceStepLabel} advanceWeekError={advanceWeekError} />
                </div>
              )}

              {!data.isWeekDone && (
                <div className="pt-3 flex justify-center">
                  <button type="button" onClick={() => setIsDayNoteOpen(true)} className="text-muted hover:text-ink transition-colors font-medium text-[13px] cursor-pointer py-1">
                    + Add a day note
                  </button>
                </div>
              )}
            </div>
          ) : (
            <AllDoneView isWeekQueueDone={data.isWeekDone} weekNumber={currentWeek} onOpenDayNote={() => setIsDayNoteOpen(true)} onAdvanceWeek={handleAdvanceWeek} isAdvancingWeek={isAdvancingWeek} advanceStepLabel={advanceStepLabel} advanceWeekError={advanceWeekError} />
          )}
        </div>
      </main>

      {/* Sheets & Modals */}
      {focusedTask && data.activeGoal && (
        <>
          <WhyThisTaskSheet isOpen={isWhyOpen} onClose={() => setIsWhyOpen(false)} task={focusedTask} milestone={data.currentMilestone} goal={data.activeGoal} streakText={data.streakText} onNotUsefulClick={() => handleAdjustSchedule('NOT_USEFUL')} />
          <StuckSheet isOpen={isStuckOpen} onClose={() => setIsStuckOpen(false)} isDailyCore={focusedTask.task_type === 'DAILY_CORE'} on10MinVersion={() => handleToggle10Min(true)} onSkipBasic={handleSkipBasic} onAdjustSchedule={handleAdjustSchedule} />
        </>
      )}

      <UndoCompleteSheet isOpen={Boolean(undoTask)} task={undoTask} onClose={() => setUndoTask(null)} onSuccess={async () => { setCompletedToast('Task marked pending · Proof deleted'); await reloadPlan(); }} />

      {data.activeGoal && (
        <>
          <DayNoteSheet isOpen={isDayNoteOpen} onClose={() => setIsDayNoteOpen(false)} goalId={data.activeGoal.id} initialText={data.todayDayNote?.text || ''} onSaved={reloadPlan} />
          <GoalSwitcherSheet isOpen={isGoalSwitcherOpen} onClose={() => setIsGoalSwitcherOpen(false)} goals={data.goals} activeGoalId={data.activeGoal.id} isPro={data.isPro} onSelectGoal={(id) => reloadPlan(id)} />
          <ThisWeekPlanModal isOpen={isWeekPlanOpen} onClose={() => setIsWeekPlanOpen(false)} weekNumber={currentWeek} milestone={data.currentMilestone} tasks={data.threadTasks} />
        </>
      )}
    </AppShell>
  );
}
