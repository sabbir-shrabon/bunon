/**
 * 1. Purpose: Database row, insert, and update types for evidence, day notes, reviews, and journey cards.
 * 2. Spec Ref: Database Schema v2.5 Section 5 (Tables 7, 8, 9, 12).
 * 3. Called By: src/types/database.ts, client and server database services.
 * 4. Calls: src/types/domain.ts.
 */

import type {
  EvidenceType,
  EvidenceVisibility,
  DayNoteSafetyStatus,
  MilestoneCompetencyStatus,
  JourneyCardVisibility,
  JourneyCardStatus,
} from '../domain';

export interface EvidenceRow {
  id: string;
  task_id: string;
  goal_id: string;
  user_id: string;
  type: EvidenceType;
  storage_path: string | null;
  external_url: string | null;
  file_size_bytes: number;
  duration_seconds: number | null;
  caption_note: string | null;
  measured_value: number | null;
  visibility: EvidenceVisibility;
  uploaded_at: string;
}

export type EvidenceInsert = Omit<Partial<EvidenceRow>, 'id' | 'uploaded_at'> & {
  task_id: string;
  goal_id: string;
  user_id: string;
  type: EvidenceType;
};

export type EvidenceUpdate = Partial<Omit<EvidenceRow, 'id' | 'task_id' | 'goal_id' | 'user_id' | 'uploaded_at'>>;

export interface DayNoteRow {
  id: string;
  goal_id: string;
  user_id: string;
  note_date: string;
  text: string;
  safety_status: DayNoteSafetyStatus;
  digested_in_plan: boolean;
  created_at: string;
  updated_at: string;
}

export type DayNoteInsert = Omit<Partial<DayNoteRow>, 'id' | 'created_at' | 'updated_at'> & {
  goal_id: string;
  user_id: string;
  note_date: string;
  text: string;
};

export type DayNoteUpdate = Partial<Omit<DayNoteRow, 'id' | 'goal_id' | 'user_id' | 'created_at'>>;

export interface WeeklyReviewRow {
  id: string;
  goal_id: string;
  week_number: number;
  ai_summary: string;
  three_bullet_lines: string[];
  on_track: boolean;
  plan_changes: string | null;
  partner_share_line: string | null;
  milestone_competency_updates_json: Array<{ milestone_position: number; competency_status: MilestoneCompetencyStatus }>;
  memory_confirmation_prompt_json: Record<string, unknown> | null;
  generation_key: string;
  job_status: 'CLAIMED' | 'COMPLETED' | 'FAILED';
  created_at: string;
}

export type WeeklyReviewInsert = Omit<Partial<WeeklyReviewRow>, 'id' | 'created_at'> & {
  goal_id: string;
  week_number: number;
  ai_summary: string;
  generation_key: string;
};

export type WeeklyReviewUpdate = Partial<Omit<WeeklyReviewRow, 'id' | 'goal_id' | 'created_at'>>;

export interface JourneyCardRow {
  id: string;
  goal_id: string;
  user_id: string;
  public_slug: string;
  journey_card_headline: string;
  day1_vs_now_story: string;
  comeback_highlight_line: string | null;
  where_i_was_note: string | null;
  featured_evidence_ids: string[];
  next_goal_suggestions_json: Array<Record<string, unknown>>;
  visibility: JourneyCardVisibility;
  status: JourneyCardStatus;
  clap_count: number;
  issued_at: string;
  revoked_at: string | null;
}

export type JourneyCardInsert = Omit<Partial<JourneyCardRow>, 'id' | 'issued_at'> & {
  goal_id: string;
  user_id: string;
  public_slug: string;
  journey_card_headline: string;
  day1_vs_now_story: string;
};

export type JourneyCardUpdate = Partial<Omit<JourneyCardRow, 'id' | 'goal_id' | 'user_id' | 'issued_at'>>;
