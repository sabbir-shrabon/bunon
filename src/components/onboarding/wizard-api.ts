/**
 * 1. Purpose: API client operations for the Onboarding wizard (Pipelines 1, 1B, 2, 3).
 * 2. Spec Ref: Prompt Catalog v2.5 Section 7 & UI Design Guide Category B.
 * 3. Called By: src/components/onboarding/use-onboarding-wizard.ts.
 * 4. Calls: /api/onboarding/* endpoints.
 */

import type { OnboardingState } from './types';
import type { Pipeline1Output, Pipeline1BOutput, Pipeline2Output } from '@/types/ai-schemas';

export const INITIAL_ONBOARDING_STATE: OnboardingState = {
  step: 'CHOOSE_PATH_10A',
  entryPath: 'FILE_NOTES',
  attachedFile: null,
  pastedNotes: '',
  outlineMode: 'FOLLOW_OUTLINE',
  extractedOutlineSummary: '',
  confirmedMemoryFacts: [],
  pipeline1BOutput: null,
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
};

export async function submitQuestionFollowups(
  state: OnboardingState,
  constraints: string
): Promise<Pipeline1Output> {
  const res = await fetch('/api/onboarding/followups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      goalTitle: state.goalTitle,
      goalWhy: state.goalWhy,
      deadlineDate: state.deadlineDate,
      workingDays: state.workingDays,
      hoursPerDay: state.hoursPerDay,
      currentBaseline: state.currentBaseline,
      constraints,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.details || errorData.error || 'Failed to generate follow-up questions');
  }
  return res.json();
}

export async function submitContextIngest(
  state: OnboardingState,
  workingDays: number[],
  hoursPerDay: number
): Promise<Pipeline1BOutput> {
  const formData = new FormData();
  if (state.attachedFile) {
    formData.append('file', state.attachedFile);
  }
  if (state.pastedNotes) {
    formData.append('pastedText', state.pastedNotes);
  }
  formData.append('outlineMode', state.outlineMode || 'FOLLOW_OUTLINE');
  formData.append('deadlineDate', state.deadlineDate);
  formData.append('workingDays', JSON.stringify(workingDays));
  formData.append('hoursPerDay', String(hoursPerDay));

  const res = await fetch('/api/onboarding/ingest-context', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.details || errorData.error || 'Failed to read context file or notes');
  }
  return res.json();
}

export async function submitRoadmapGeneration(
  state: OnboardingState,
  category: string,
  answers: Record<number, string>,
  isRegen: boolean,
  regenReason: string,
  regenNotes: string
): Promise<Pipeline2Output> {
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
      outlineMode: state.outlineMode,
      outline_mode: state.outlineMode,
      extractedOutlineSummary: state.extractedOutlineSummary,
      extracted_outline_summary: state.extractedOutlineSummary,
      followupAnswers: answers,
      availableHoursTotal: state.availableHoursTotal,
      planVariation: isRegen ? 'B' : 'A',
      regenerationReason: regenReason,
      regenerationNotes: regenNotes,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.details || errorData.error || 'Failed to generate roadmap');
  }
  return res.json();
}

export async function submitLockAndPlan(
  state: OnboardingState,
  style: 'FLEXIBLE_WEEK' | 'DAILY_ADAPTIVE',
  reminderTime: string
): Promise<void> {
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

  const followupQuestions = state.pipeline1Output?.followup_questions || [];
  const followupQa = Object.entries(state.followupAnswers).map(([idxStr, answer]) => {
    const qIdx = parseInt(idxStr, 10);
    const questionText = followupQuestions[qIdx]?.question || `Question ${qIdx + 1}`;
    return { question: questionText, answer };
  });

  const payload = {
    goalTitle: state.goalTitle,
    goalWhy: state.goalWhy,
    goalCategory: state.confirmedCategory,
    category: state.confirmedCategory,
    deadlineDate: state.deadlineDate,
    totalWeeks: state.totalWeeks,
    workingDays: state.workingDays,
    hoursPerDay: state.hoursPerDay,
    currentBaseline: state.currentBaseline,
    constraints: state.constraints || '',
    executionMode: state.executionMode,
    planStyle: style,
    outlineMode: state.outlineMode,
    outline_mode: state.outlineMode,
    extractedOutlineSummary: state.extractedOutlineSummary,
    extracted_outline_summary: state.extractedOutlineSummary,
    confirmedMemoryFacts: state.confirmedMemoryFacts,
    confirmed_memory_facts: state.confirmedMemoryFacts,
    milestones,
    used_context_ids: activeRoadmap?.used_context_ids || [],
    boosters: state.pipeline1Output?.missing_context_boosters || [],
    reminderTime,
    previousRoadmapJson: state.previousRoadmap || null,
    followup_qa: followupQa,
  };

  const res = await fetch('/api/onboarding/lock-and-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.details || errorData.error || 'Failed to build Week 1');
  }
}
