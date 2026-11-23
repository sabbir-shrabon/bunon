/**
 * 1. Purpose: Shared UI types, props, and view-state interfaces for the Today Screen 22 experience.
 * 2. Spec Ref: Stitch Screen 22, State 22a, and Category C screens.
 * 3. Called By: Today view components and sheets.
 * 4. Calls: Domain and database types.
 */

import type { GoalRow, MilestoneRow, TaskRow } from '@/types/db/goal-tables';
import type { DayNoteRow } from '@/types/db/evidence-tables';
import type { SubStepItem } from '@/types/domain';
import type { PersonaProfile } from '@/lib/ai/persona-engine';
import type { StepSlicerResult } from '@/lib/ai/step-slicer';
import type { ContextBannerData } from '@/lib/services/context-banner-service';

export interface TaskEvidenceItem {
  id: string;
  type: string;
  storage_path: string | null;
  signed_url?: string | null;
  external_url: string | null;
  caption_note: string | null;
  file_size_bytes: number;
  uploaded_at: string;
}

export interface ThreadTaskItem extends TaskRow {
  milestone_position?: number;
  milestone_title?: string;
  evidence?: TaskEvidenceItem[];
}

export interface TodayGoalItem {
  id: string;
  title: string;
  category: string;
  pendingCount: number;
}

export interface TodayScreenData {
  hasActiveGoal: boolean;
  isPaused: boolean;
  goals: TodayGoalItem[];
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
  isGuest?: boolean;
}
