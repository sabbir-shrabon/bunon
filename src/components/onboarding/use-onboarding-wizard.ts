/**
 * 1. Purpose: Custom hook managing state transitions and API calls for Two-Path Onboarding.
 * 2. Spec Ref: Category B in UI Design Guide & Master Build Plan v2.5.
 * 3. Called By: OnboardingWizard.
 * 4. Calls: wizard-api helpers, next/navigation.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OnboardingState, OnboardingEntryPath } from '@/components/onboarding/types';
import type { EditableMemoryFact } from '@/components/onboarding/understood-facts-card';
import type { OutlineMode } from '@/types/domain';
import {
  INITIAL_ONBOARDING_STATE,
  submitQuestionFollowups,
  submitContextIngest,
  submitRoadmapGeneration,
  submitLockAndPlan,
} from './wizard-api';

export function useOnboardingWizard() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>(INITIAL_ONBOARDING_STATE);
  const [aiFollowupIndex, setAiFollowupIndex] = useState(0);

  const handleSelectPath = (entryPath: OnboardingEntryPath) => {
    setState((s) => ({
      ...s,
      entryPath,
      step: entryPath === 'FILE_NOTES' ? 'FILE_CONTEXT_10B' : 'Q1_GOAL_WHY',
    }));
  };

  const handleFileContext = (file: File | null, pastedText: string, outlineMode: OutlineMode) => {
    setState((s) => ({
      ...s,
      attachedFile: file,
      pastedNotes: pastedText,
      outlineMode,
      step: 'Q2_DEADLINE',
    }));
  };

  const handleQ1 = (goalTitle: string, goalWhy: string) => {
    setState((s) => ({ ...s, goalTitle, goalWhy, step: 'Q2_DEADLINE' }));
  };

  const handleQ2 = (deadlineDate: string, totalWeeks: number) => {
    setState((s) => ({ ...s, deadlineDate, totalWeeks, step: 'Q3_WORKING_DAYS' }));
  };

  const handleQ3 = (workingDays: number[], hoursPerDay: number) => {
    const totalHours = workingDays.length * hoursPerDay * state.totalWeeks;
    if (state.entryPath === 'FILE_NOTES') {
      const updated = {
        ...state,
        workingDays,
        hoursPerDay,
        availableHoursTotal: totalHours,
        step: 'LOADING_FOLLOWUPS' as const,
      };
      setState(updated);
      void executeContextIngest(updated, workingDays, hoursPerDay);
    } else {
      setState((s) => ({
        ...s,
        workingDays,
        hoursPerDay,
        availableHoursTotal: totalHours,
        step: 'Q4_BASELINE',
      }));
    }
  };

  const handleQ4 = (currentBaseline: string) => {
    setState((s) => ({ ...s, currentBaseline, step: 'Q5_CONSTRAINTS' }));
  };

  const handleQ5 = async (constraints: string) => {
    const updated = { ...state, constraints, step: 'LOADING_FOLLOWUPS' as const };
    setState(updated);
    try {
      const data = await submitQuestionFollowups(updated, constraints);
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

  const executeContextIngest = async (currentState: OnboardingState, days: number[], hours: number) => {
    try {
      const data = await submitContextIngest(currentState, days, hours);
      if (data.safety_status === 'REFUSE_UNSAFE' || data.safety_status === 'DISTURBING_HELP') {
        setState((s) => ({
          ...s,
          pipeline1Output: {
            safety_status: data.safety_status,
            safety_message: data.safety_message,
            detected_category: data.detected_category,
            execution_mode: data.execution_mode,
            recommended_plan_style: data.recommended_plan_style,
            followup_questions: [],
            missing_context_boosters: [],
          },
          step: 'SAFETY',
        }));
        return;
      }

      setState((s) => ({
        ...s,
        pipeline1BOutput: data,
        goalTitle: data.extracted_goal_title,
        goalWhy: data.extracted_goal_why,
        currentBaseline: data.extracted_baseline,
        constraints: data.extracted_constraints,
        extractedOutlineSummary: data.condensed_outline_summary,
        confirmedCategory: data.detected_category,
        executionMode: data.execution_mode,
        planStyle: data.recommended_plan_style,
        confirmedMemoryFacts: data.extracted_memory_facts,
        pipeline1Output: {
          safety_status: data.safety_status,
          safety_message: data.safety_message,
          detected_category: data.detected_category,
          execution_mode: data.execution_mode,
          recommended_plan_style: data.recommended_plan_style,
          followup_questions: data.followup_questions || [],
          missing_context_boosters: [],
        },
        step: 'CONFIRM_CATEGORY',
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Context file ingestion failed';
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
      const roadmap = await submitRoadmapGeneration(state, category, answers, isRegen, regenReason, regenNotes);
      setState((s) => {
        let facts = s.confirmedMemoryFacts;
        if (s.entryPath === 'QUESTIONS' && (!facts || facts.length === 0)) {
          facts = [
            { scope: 'GOAL' as const, bucket: 'knowledge_and_skill_gaps', fact: s.currentBaseline || 'Starting Day 1 with baseline knowledge' },
            { scope: 'PERSON' as const, bucket: 'life_rhythm_and_constraints', fact: s.constraints || `${s.hoursPerDay}h/day schedule` },
            { scope: 'GOAL' as const, bucket: 'what_works_for_this_user', fact: `Why it matters: ${s.goalWhy}` },
          ];
        }
        return {
          ...s,
          previousRoadmap: isRegen ? s.pipeline2Output : null,
          pipeline2Output: roadmap,
          activePlanVersion: isRegen ? 'B' : 'A',
          confirmedMemoryFacts: facts,
          step: 'ROADMAP_PREVIEW',
        };
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Roadmap generation failed';
      setState((s) => ({ ...s, errorMessage: msg, step: 'ERROR_STATE_21' }));
    }
  };

  const handleLockAndPlan = async (style: 'FLEXIBLE_WEEK' | 'DAILY_ADAPTIVE', reminderTime: string) => {
    setState((s) => ({ ...s, step: 'LOADING_ROADMAP' }));
    try {
      await submitLockAndPlan(state, style, reminderTime);
      router.push('/today');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to finalize plan';
      setState((s) => ({ ...s, errorMessage: msg, step: 'ERROR_STATE_21' }));
    }
  };

  const setConfirmedMemoryFacts = (facts: EditableMemoryFact[]) => {
    setState((s) => ({ ...s, confirmedMemoryFacts: facts }));
  };

  return {
    state,
    setState,
    aiFollowupIndex,
    setAiFollowupIndex,
    handleSelectPath,
    handleFileContext,
    handleQ1,
    handleQ2,
    handleQ3,
    handleQ4,
    handleQ5,
    executeContextIngest,
    handleConfirmCategory,
    handleAiFollowupAnswer,
    buildRoadmap,
    handleLockAndPlan,
    setConfirmedMemoryFacts,
  };
}
