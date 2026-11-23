/**
 * 1. Purpose: Custom hook managing state transitions and API calls for the Onboarding wizard.
 * 2. Spec Ref: Category B in UI Design Guide & Rulebook Section 2.
 * 3. Called By: OnboardingWizard.
 * 4. Calls: /api/onboarding/followups, /api/onboarding/roadmap, /api/onboarding/lock-and-plan.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OnboardingState } from '@/components/onboarding/types';
import type { Pipeline1Output, Pipeline2Output } from '@/types/ai-schemas';

export function useOnboardingWizard() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>({
    step: 'Q1_GOAL_WHY',
    goalTitle: '',
    goalWhy: '',
    deadlineDate: '',
    totalWeeks: 12,
    workingDays: [],
    hoursPerDay: 2.0,
    currentBaseline: '',
    constraints: '',
    pipeline1Output: null,
    confirmedCategory: 'OTHER',
    executionMode: 'deliverable_queue',
    planStyle: 'DAILY_ADAPTIVE',
    followupAnswers: {},
    pipeline2Output: null,
    previousRoadmap: null,
    activePlanVersion: 'A',
    availableHoursTotal: 0,
    showFeasibilitySheet: false,
    reminderTime: '08:00 AM',
    errorMessage: '',
  });

  const [aiFollowupIndex, setAiFollowupIndex] = useState(0);

  const handleQ1 = (goalTitle: string, goalWhy: string) => {
    setState((s) => ({ ...s, goalTitle, goalWhy, step: 'Q2_DEADLINE' }));
  };

  const handleQ2 = (deadlineDate: string, totalWeeks: number) => {
    setState((s) => ({ ...s, deadlineDate, totalWeeks, step: 'Q3_WORKING_DAYS' }));
  };

  const handleQ3 = (workingDays: number[], hoursPerDay: number) => {
    const totalHours = workingDays.length * hoursPerDay * state.totalWeeks;
    setState((s) => ({
      ...s,
      workingDays,
      hoursPerDay,
      availableHoursTotal: totalHours,
      step: 'Q4_BASELINE',
    }));
  };

  const handleQ4 = (currentBaseline: string) => {
    setState((s) => ({ ...s, currentBaseline, step: 'Q5_CONSTRAINTS' }));
  };

  const handleQ5 = async (constraints: string) => {
    const updated = { ...state, constraints, step: 'LOADING_FOLLOWUPS' as const };
    setState(updated);

    try {
      const res = await fetch('/api/onboarding/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalTitle: updated.goalTitle,
          goalWhy: updated.goalWhy,
          deadlineDate: updated.deadlineDate,
          workingDays: updated.workingDays,
          hoursPerDay: updated.hoursPerDay,
          currentBaseline: updated.currentBaseline,
          constraints,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg =
          errorData.message || errorData.details || errorData.error || 'Failed to generate follow-up questions';
        throw new Error(errorMsg);
      }
      const data: Pipeline1Output = await res.json();

      if (data.safety_status === 'REFUSE_UNSAFE' || data.safety_status === 'DISTURBING_HELP') {
        setState((s) => ({ ...s, pipeline1Output: data, step: 'SAFETY' }));
        return;
      }

      setState((s) => ({
        ...s,
        pipeline1Output: data,
        confirmedCategory: data.detected_category,
        executionMode: data.execution_mode,
        planStyle: data.recommended_plan_style,
        step: 'CONFIRM_CATEGORY',
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Plan engine connection failed';
      setState((s) => ({ ...s, errorMessage: msg, step: 'ERROR_STATE_21' }));
    }
  };

  const handleConfirmCategory = (confirmedCategory: string) => {
    const followups = state.pipeline1Output?.followup_questions || [];
    if (followups.length > 0) {
      setAiFollowupIndex(0);
      setState((s) => ({ ...s, confirmedCategory, step: 'AI_FOLLOWUPS' }));
    } else {
      buildRoadmap(confirmedCategory, {});
    }
  };

  const handleAiFollowupAnswer = (answer: string) => {
    const followups = state.pipeline1Output?.followup_questions || [];
    const updatedAnswers = { ...state.followupAnswers, [aiFollowupIndex]: answer };
    const nextIdx = aiFollowupIndex + 1;

    if (nextIdx < followups.length) {
      setAiFollowupIndex(nextIdx);
      setState((s) => ({ ...s, followupAnswers: updatedAnswers }));
    } else {
      setState((s) => ({ ...s, followupAnswers: updatedAnswers }));
      buildRoadmap(state.confirmedCategory, updatedAnswers);
    }
  };

  const buildRoadmap = async (
    category: string,
    answers: Record<number, string>,
    isRegen = false,
    regenReason = '',
    regenNotes = ''
  ) => {
    setState((s) => ({ ...s, step: 'LOADING_ROADMAP' }));
    try {
      const res = await fetch('/api/onboarding/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalTitle: state.goalTitle,
          goalWhy: state.goalWhy,
          deadlineDate: state.deadlineDate,
          totalWeeks: state.totalWeeks,
          workingDays: state.workingDays,
          hoursPerDay: state.hoursPerDay,
          currentBaseline: state.currentBaseline,
          constraints: state.constraints,
          category,
          executionMode: state.executionMode,
          followupAnswers: answers,
          availableHoursTotal: state.availableHoursTotal,
          planVariation: isRegen ? 'B' : 'A',
          regenerationReason: regenReason,
          regenerationNotes: regenNotes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg =
          errorData.message || errorData.details || errorData.error || 'Failed to generate roadmap';
        throw new Error(errorMsg);
      }
      const roadmap: Pipeline2Output = await res.json();

      setState((s) => ({
        ...s,
        previousRoadmap: isRegen ? s.pipeline2Output : null,
        pipeline2Output: roadmap,
        activePlanVersion: isRegen ? 'B' : 'A',
        step: 'ROADMAP_PREVIEW',
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Roadmap generation failed';
      setState((s) => ({ ...s, errorMessage: msg, step: 'ERROR_STATE_21' }));
    }
  };

  const handleLockAndPlan = async (style: 'FLEXIBLE_WEEK' | 'DAILY_ADAPTIVE', reminderTime: string) => {
    setState((s) => ({ ...s, step: 'LOADING_ROADMAP' }));
    try {
      const activeRoadmap =
        state.activePlanVersion === 'A' && state.previousRoadmap
          ? state.previousRoadmap
          : state.pipeline2Output;

      const rawMilestones = activeRoadmap?.milestones || [];
      const milestones = rawMilestones.map((m, idx) => ({
        position: m.position || idx + 1,
        title: (m.title || `Milestone ${idx + 1}`).trim(),
        expected_result: (m.expected_result || '').trim(),
        estimated_hours: typeof m.estimated_hours === 'number' && m.estimated_hours > 0 ? m.estimated_hours : 10,
        target_metric_value: typeof m.target_metric_value === 'number' && !isNaN(m.target_metric_value) ? m.target_metric_value : null,
        target_metric_unit: m.target_metric_unit ? String(m.target_metric_unit).trim() : null,
      }));

      const usedContextIds = activeRoadmap?.used_context_ids || [];
      const boosters = state.pipeline1Output?.missing_context_boosters || [];

      // Format followup Q&A if present
      const followupQuestions = state.pipeline1Output?.followup_questions || [];
      const followupQa = Object.entries(state.followupAnswers).map(([idxStr, answer]) => {
        const qIdx = parseInt(idxStr, 10);
        const questionText = followupQuestions[qIdx]?.question || `Question ${qIdx + 1}`;
        return { question: questionText, answer };
      });

      const payload = {
        goalTitle: state.goalTitle,
        goal_title: state.goalTitle,
        goalWhy: state.goalWhy,
        goal_why: state.goalWhy,
        goalCategory: state.confirmedCategory,
        goal_category: state.confirmedCategory,
        category: state.confirmedCategory,
        deadlineDate: state.deadlineDate,
        deadline_date: state.deadlineDate,
        deadline: state.deadlineDate,
        totalWeeks: state.totalWeeks,
        total_weeks: state.totalWeeks,
        workingDays: state.workingDays,
        working_days: state.workingDays,
        hoursPerDay: state.hoursPerDay,
        hours_per_day: state.hoursPerDay,
        currentBaseline: state.currentBaseline,
        current_baseline: state.currentBaseline,
        constraints: state.constraints || '',
        executionMode: state.executionMode,
        execution_mode: state.executionMode,
        planStyle: style,
        plan_style: style,
        milestones,
        used_context_ids: usedContextIds,
        boosters,
        reminderTime,
        reminder_time: reminderTime,
        previousRoadmapJson: state.previousRoadmap || null,
        previous_roadmap_json: state.previousRoadmap || null,
        followupAnswers: state.followupAnswers,
        followup_qa: followupQa,
        followupQa,
        onboarding_answers: followupQa,
      };

      const res = await fetch('/api/onboarding/lock-and-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg =
          errorData.message || errorData.details || errorData.error || 'Failed to build Week 1';
        console.error('[lock-and-plan client error]', { status: res.status, errorData });
        throw new Error(errorMsg);
      }
      router.push('/today');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to finalize plan';
      setState((s) => ({ ...s, errorMessage: msg, step: 'ERROR_STATE_21' }));
    }
  };

  return {
    state,
    setState,
    aiFollowupIndex,
    setAiFollowupIndex,
    handleQ1,
    handleQ2,
    handleQ3,
    handleQ4,
    handleQ5,
    handleConfirmCategory,
    handleAiFollowupAnswer,
    buildRoadmap,
    handleLockAndPlan,
  };
}
