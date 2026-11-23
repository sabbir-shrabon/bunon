/**
 * 1. Purpose: Shared types for the multi-step Onboarding wizard state machine.
 * 2. Spec Ref: Category B Screens 10–21 in UI Design Guide.
 * 3. Called By: Onboarding wizard and step components.
 * 4. Calls: ai-schemas.
 */

import type { Pipeline1Output, Pipeline2Output } from '@/types/ai-schemas';

export interface OnboardingState {
  step:
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
