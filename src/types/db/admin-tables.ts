/**
 * 1. Purpose: Database row, insert, and update types for AI prompts, telemetry, and admin auditing.
 * 2. Spec Ref: Database Schema v2.5 Section 5 (Tables 17-23).
 * 3. Called By: src/types/database.ts, client and server database services.
 * 4. Calls: src/types/domain.ts.
 */

import type {
  PromptLayer,
  AIPipelineKey,
  AICallStatus,
  SupportTicketKind,
  SupportTicketStatus,
  ReportTargetType,
  ReportStatus,
} from '../domain';

export interface PromptVersionRow {
  id: string;
  prompt_key: string;
  layer: PromptLayer;
  version: number;
  template_text: string;
  field_descriptions_json: Record<string, unknown>;
  locked_output_schema_json: Record<string, unknown>;
  allowed_variables: string[];
  active: boolean;
  author_admin_id: string | null;
  created_at: string;
  activated_at: string | null;
}

export type PromptVersionInsert = Omit<Partial<PromptVersionRow>, 'id' | 'created_at'> & {
  prompt_key: string;
  layer: PromptLayer;
  template_text: string;
};

export type PromptVersionUpdate = Partial<Omit<PromptVersionRow, 'id' | 'created_at'>>;

export interface RegionalKnowledgeRow {
  id: string;
  country: string;
  category: string;
  content_text: string;
  active: boolean;
  created_at: string;
}

export type RegionalKnowledgeInsert = Omit<Partial<RegionalKnowledgeRow>, 'id' | 'created_at'> & {
  country: string;
  category: string;
  content_text: string;
};

export type RegionalKnowledgeUpdate = Partial<Omit<RegionalKnowledgeRow, 'id' | 'created_at'>>;

export interface AICallRow {
  id: string;
  user_id: string | null;
  goal_id: string | null;
  pipeline: AIPipelineKey;
  prompt_version_id: string;
  model_name: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  latency_ms: number;
  status: AICallStatus;
  error_code: string | null;
  created_at: string;
}

export type AICallInsert = Omit<Partial<AICallRow>, 'id' | 'created_at'> & {
  pipeline: AIPipelineKey;
  prompt_version_id: string;
  model_name: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  latency_ms: number;
  status: AICallStatus;
};

export interface SupportTicketRow {
  id: string;
  user_id: string;
  kind: SupportTicketKind;
  category_tag: string;
  message: string;
  app_version: string | null;
  screen_path: string | null;
  status: SupportTicketStatus;
  admin_reply: string | null;
  replied_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
}

export type SupportTicketInsert = Omit<Partial<SupportTicketRow>, 'id' | 'created_at' | 'updated_at'> & {
  user_id: string;
  category_tag: string;
  message: string;
};

export type SupportTicketUpdate = Partial<Omit<SupportTicketRow, 'id' | 'user_id' | 'created_at'>>;

export interface ReportRow {
  id: string;
  target_type: ReportTargetType;
  target_id: string | null;
  target_slug: string;
  reason: string;
  reporter_note: string | null;
  status: ReportStatus;
  handled_by_admin_id: string | null;
  created_at: string;
}

export type ReportInsert = Omit<Partial<ReportRow>, 'id' | 'created_at'> & {
  target_type: ReportTargetType;
  target_slug: string;
  reason: string;
};

export type ReportUpdate = Partial<Omit<ReportRow, 'id' | 'created_at'>>;

export interface SystemSettingsRow {
  id: number;
  global_daily_ai_cap_usd: number;
  free_monthly_ai_cap_usd: number;
  pro_monthly_ai_cap_usd: number;
  ai_kill_switch: boolean;
  full_maintenance_mode: boolean;
  active_gemini_model: string;
  pipeline_models_json: Record<string, string>;
  graceful_model_fallback_enabled: boolean;
  free_storage_quota_bytes: number;
  pro_storage_quota_bytes: number;
  max_file_size_bytes: number;
  max_video_duration_seconds: number;
  ai_rate_limit_per_min: number;
  min_required_app_version: string;
  logical_day_rollover_hour: number;
  offline_sync_grace_hours: number;
  referral_reward_days: number;
  max_monthly_referral_days: number;
  free_roadmap_allowance: number;
  pro_roadmap_allowance: number;
  updated_at: string;
}

export type SystemSettingsUpdate = Partial<Omit<SystemSettingsRow, 'id'>>;

export interface AdminAuditLogRow {
  id: string;
  admin_id: string | null;
  admin_role: string;
  action: string;
  target_type: string;
  target_id: string;
  reason_note: string;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export type AdminAuditLogInsert = Omit<Partial<AdminAuditLogRow>, 'id' | 'created_at'> & {
  admin_role: string;
  action: string;
  target_type: string;
  target_id: string;
  reason_note: string;
};
