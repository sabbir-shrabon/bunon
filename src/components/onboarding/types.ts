/**
 * 1. Purpose: Shared types for the multi-step Onboarding wizard state machine (Two-Path Onboarding).
 * 2. Spec Ref: Category B Screens 10a–21 in UI Design Guide & Master Build Plan v2.5.
 * 3. Called By: Onboarding wizard, step components, useOnboardingWizard hook.
 * 4. Calls: ai-schemas, domain.
 */

import type { Pipeline1Output, Pipeline1BOutput, Pipeline2Output } from '@/types/ai-schemas';
import type { OutlineMode } from '@/types/domain';

export type OnboardingStep =
  | 'CHOOSE_PATH_10A'
  | 'FILE_CONTEXT_10B'
  | 'Q1_GOAL_WHY'
  | 'Q2_DEADLINE'
  | 'Q3_WORKING_DAYS'
  | 'Q4_BASELINE'
  | 'Q5_CONSTRAINTS'
  | 'LOADING_FOLLOWUPS'
  | 'SAFETY'
  | 'CONFIRM_CATEGORY'
  | 'AI_FOLLOWUPS'
  | 'LOADING_ROADMAP'
  | 'ROADMAP_PREVIEW'
  | 'CHOOSE_WEEKLY_STYLE'
  | 'ERROR_STATE_21';

export type OnboardingEntryPath = 'QUESTIONS' | 'FILE_NOTES';

export interface OnboardingState {
  step: OnboardingStep;
  entryPath: OnboardingEntryPath;

  // File / Notes Context (Two-Path Onboarding)
  attachedFiles: File[];
  pastedNotes: string;
  outlineMode: OutlineMode;
  extractedOutlineSummary: string;
  confirmedMemoryFacts: Array<{ scope: 'PERSON' | 'GOAL'; bucket: string; fact: string }>;
  pipeline1BOutput: Pipeline1BOutput | null;

  // Fixed Basics
  goalTitle: string;
  goalWhy: string;
  deadlineDate: string;
  totalWeeks: number;
  workingDays: number[];
  hoursPerDay: number;
  currentBaseline: string;
  constraints: string;

  // Pipeline 1 Results
  pipeline1Output: Pipeline1Output | null;
  confirmedCategory: string;
  executionMode: 'deliverable_queue' | 'daily_quota';
  planStyle: 'FLEXIBLE_WEEK' | 'DAILY_ADAPTIVE';
  followupAnswers: Record<number, string>;

  // Pipeline 2 Results
  pipeline2Output: Pipeline2Output | null;
  previousRoadmap: Pipeline2Output | null;
  activePlanVersion: 'A' | 'B';
  availableHoursTotal: number;
  showFeasibilitySheet: boolean;

  // Screen 20 Reminder
  reminderTime: string;

  // Errors
  errorMessage: string;
}
