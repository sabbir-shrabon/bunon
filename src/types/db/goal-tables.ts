/**
 * 1. Purpose: Database row, insert, and update types for goals, onboarding answers, milestones, and tasks.
 * 2. Spec Ref: Database Schema v2.5 Section 5 (Tables 3, 4, 5, 6).
 * 3. Called By: src/types/database.ts, client and server database services.
 * 4. Calls: src/types/domain.ts.
 */

import type {
  ExecutionMode,
  PlanStyle,
  GoalStatus,
  GoalVisibility,
  UserState,
  OnboardingStage,
  MemoryScope,
  MilestoneStatus,
  MilestoneCompetencyStatus,
  MilestoneResultFeedback,
  TaskType,
  AdaptationPolicy,
  TaskStatus,
  TaskSkipReason,
  HowToStepsData,
  DayTimeMap,
  OutlineMode,
} from '../domain';

export interface GoalRow {
  id: string;
  user_id: string;
  title: string;
  why: string;
  category: string;
  execution_mode: ExecutionMode;
  plan_style: PlanStyle;
  outline_mode: OutlineMode;
  extracted_outline_summary: string | null;
  streak_weeks: number;
  current_week_number: number;
  last_activity_date: string | null;
  is_mvg_shrunk: boolean;
  current_baseline_text: string;
  custom_week_intent: string | null;
  deadline: string;
  hours_per_day: number;
  working_days: number[];
  status: GoalStatus;
  user_state: UserState;
  user_persona_profile_json: Record<string, unknown>;
  today_context_line: string | null;
  paused_until: string | null;
  pause_reason: string | null;
  total_paused_days: number;
  locked_date: string | null;
  week_start_day: number;
  last_synced_logical_date: string | null;
  day_time_map_json: DayTimeMap;
  journey_memory_json: Record<string, unknown>;
  memory_version: number;
  deep_memory_json: Record<string, unknown>;
  comeback_weeks_count?: number;
  last_miss_cause?: string | null;
  memory_scope: MemoryScope;
  visibility: GoalVisibility;
  version_number: number;
  created_at: string;
  updated_at: string;
}

export type GoalInsert = Omit<
  Partial<GoalRow>,
  'id' | 'title' | 'why' | 'category' | 'deadline' | 'hours_per_day' | 'working_days' | 'created_at' | 'updated_at'
> & {
  title: string;
  why: string;
  category: string;
  deadline: string;
  hours_per_day: number;
  working_days: number[];
  user_id: string;
};

export type GoalUpdate = Partial<Omit<GoalRow, 'id' | 'user_id' | 'created_at'>>;

export interface OnboardingAnswerRow {
  id: string;
  goal_id: string;
  stage: OnboardingStage;
  question_index: number;
  question_text: string;
  answer_text: string | null;
  created_at: string;
}

export type OnboardingAnswerInsert = Omit<Partial<OnboardingAnswerRow>, 'id' | 'created_at'> & {
  goal_id: string;
  stage: OnboardingStage;
  question_index: number;
  question_text: string;
};

export type OnboardingAnswerUpdate = Partial<Omit<OnboardingAnswerRow, 'id' | 'goal_id' | 'created_at'>>;

export interface MilestoneRow {
  id: string;
  goal_id: string;
  position: number;
  title: string;
  expected_result: string;
  estimated_hours: number;
  target_metric_value: number | null;
  target_metric_unit: string | null;
  status: MilestoneStatus;
  competency_status: MilestoneCompetencyStatus;
  result_feedback: MilestoneResultFeedback | null;
  prompt_version_id: string | null;
  reached_at: string | null;
}

export type MilestoneInsert = Omit<
  Partial<MilestoneRow>,
  'id' | 'goal_id' | 'position' | 'title' | 'expected_result' | 'estimated_hours'
> & {
  goal_id: string;
  position: number;
  title: string;
  expected_result: string;
  estimated_hours: number;
};

export type MilestoneUpdate = Partial<Omit<MilestoneRow, 'id' | 'goal_id'>>;

export interface TaskRow {
  id: string;
  goal_id: string;
  milestone_id: string;
  week_number: number;
  task_type: TaskType;
  adaptation_policy: AdaptationPolicy;
  sequence_order: number;
  target_count: number;
  completed_count: number;
  last_quota_logged_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  title: string;
  done_means: string;
  how_to_steps_json: HowToStepsData;
  min_version_10m: string;
  why_it_matters: string;
  used_context_ids: string[];
  estimate_minutes: number;
  used_10m_version: boolean;
  is_stretch_task: boolean;
  status: TaskStatus;
  skip_reason: TaskSkipReason | null;
  carried_count: number;
  effort_rating: string | null;
  effort_rated_at: string | null;
  stuck_reason: string | null;
  marked_not_useful: boolean;
  original_task_json: Record<string, unknown> | null;
  adaptation_reason: string | null;
  prompt_version_id: string | null;
}

export type TaskInsert = Omit<
  Partial<TaskRow>,
  'id' | 'goal_id' | 'milestone_id' | 'week_number' | 'title' | 'done_means' | 'min_version_10m' | 'why_it_matters' | 'estimate_minutes'
> & {
  goal_id: string;
  milestone_id: string;
  week_number: number;
  title: string;
  done_means: string;
  min_version_10m: string;
  why_it_matters: string;
  estimate_minutes: number;
};

export type TaskUpdate = Partial<Omit<TaskRow, 'id' | 'goal_id' | 'milestone_id'>>;
