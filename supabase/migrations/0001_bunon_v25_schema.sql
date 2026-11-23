-- Bunon v2.5 Master Database Schema Migration
-- Complete 22+ Table Architecture, RLS Policies, Triggers & Competition Addendum
-- Target: Supabase PostgreSQL (Singapore ap-southeast-1)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CORE USER & ACCOUNT TABLES
-- ============================================================================

-- Table 1: users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  auth_provider TEXT NOT NULL DEFAULT 'EMAIL',
  name TEXT NOT NULL,
  avatar_url TEXT NULL,
  bio VARCHAR(80) NULL,
  city_country VARCHAR(80) NULL,
  work_study_role VARCHAR(80) NULL,
  birth_year SMALLINT NULL, -- Nullable on guest/first signup, validated >= 18 on update
  country VARCHAR(4) NOT NULL DEFAULT 'BD',
  language VARCHAR(4) NOT NULL DEFAULT 'EN' CHECK (language IN ('EN', 'BN')),
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
  timezone TEXT NOT NULL DEFAULT 'Asia/Dhaka',
  reminder_time TIME NOT NULL DEFAULT '08:00:00',
  last_reminder_nudge_at TIMESTAMPTZ NULL,
  preferred_coaching_tone TEXT NOT NULL DEFAULT 'GENTLE' CHECK (preferred_coaching_tone IN ('GENTLE', 'STRAIGHT', 'SHORT')),
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  email_reminders_enabled BOOLEAN NOT NULL DEFAULT false,
  theme TEXT NOT NULL DEFAULT 'LIGHT' CHECK (theme IN ('LIGHT', 'DARK')),
  streak_count INTEGER NOT NULL DEFAULT 0,
  streak_visible BOOLEAN NOT NULL DEFAULT false,
  last_working_task_date DATE NULL,
  person_memory_json JSONB NOT NULL DEFAULT '{"version":1,"items":[]}'::jsonb,
  person_memory_version INTEGER NOT NULL DEFAULT 1,
  day_time_map_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  pro_until TIMESTAMPTZ NULL,
  pro_source TEXT NULL,
  storage_used_bytes BIGINT NOT NULL DEFAULT 0,
  daily_photo_date DATE NULL,
  daily_photo_count SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 2: admin_users_2fa
CREATE TABLE IF NOT EXISTS public.admin_users_2fa (
  admin_user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  totp_secret_encrypted TEXT NULL,
  totp_enabled BOOLEAN NOT NULL DEFAULT false,
  session_version INTEGER NOT NULL DEFAULT 1,
  failed_login_attempts SMALLINT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ NULL,
  last_login_at TIMESTAMPTZ NULL,
  last_login_ip INET NULL
);

-- ============================================================================
-- 2. SYSTEM, PROMPT & CATEGORY TABLES
-- ============================================================================

-- Table 18: goal_categories
CREATE TABLE IF NOT EXISTS public.goal_categories (
  slug TEXT PRIMARY KEY,
  label_en TEXT NOT NULL,
  label_bn TEXT NOT NULL,
  detection_hint TEXT NOT NULL,
  skill_prompt_key TEXT NULL,
  regional_context_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default_fallback BOOLEAN NOT NULL DEFAULT false
);

-- Table 17: prompt_versions
CREATE TABLE IF NOT EXISTS public.prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_key TEXT NOT NULL,
  layer TEXT NOT NULL CHECK (layer IN ('CORE', 'SKILL', 'REGIONAL', 'PIPELINE')),
  version INTEGER NOT NULL DEFAULT 1,
  template_text TEXT NOT NULL,
  field_descriptions_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  locked_output_schema_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  allowed_variables TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT false,
  author_admin_id UUID NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS one_active_version_per_prompt
ON public.prompt_versions (prompt_key)
WHERE active = true;

-- Table 19: regional_knowledge
CREATE TABLE IF NOT EXISTS public.regional_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country VARCHAR(6) NOT NULL, -- Supports 'BD', 'GLOBAL', etc.
  category TEXT NOT NULL,
  content_text TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 21 (pricing): pricing_plans
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  item_code TEXT PRIMARY KEY CHECK (item_code IN ('PASS_1M', 'PASS_3M', 'PASS_6M', 'PASS_12M')),
  title_en TEXT NOT NULL,
  title_bn TEXT NOT NULL,
  price_bdt INTEGER NOT NULL,
  price_usd NUMERIC(6,2) NULL, -- Competition Addendum for multi-currency display
  original_price_bdt INTEGER NULL,
  badge_text_en TEXT NULL,
  badge_text_bn TEXT NULL,
  promo_starts_at TIMESTAMPTZ NULL,
  promo_ends_at TIMESTAMPTZ NULL,
  duration_days INTEGER NOT NULL,
  is_recommended BOOLEAN NOT NULL DEFAULT false
);

-- Table 22 (settings): system_settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  global_daily_ai_cap_usd NUMERIC(8,2) NOT NULL DEFAULT 5.00,
  free_monthly_ai_cap_usd NUMERIC(8,2) NOT NULL DEFAULT 0.15,
  pro_monthly_ai_cap_usd NUMERIC(8,2) NOT NULL DEFAULT 0.80,
  ai_kill_switch BOOLEAN NOT NULL DEFAULT false,
  full_maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  active_gemini_model TEXT NOT NULL DEFAULT 'gemini-3.5-flash-lite',
  pipeline_models_json JSONB NOT NULL DEFAULT '{"PIPELINE_1":"gemini-3.5-flash-lite","PIPELINE_2":"gemini-3.5-flash-lite","PIPELINE_3":"gemini-3.5-flash-lite","PIPELINE_4":"gemini-3.5-flash-lite","PIPELINE_5":"gemini-3.5-flash-lite","PIPELINE_6":"gemini-3.5-flash-lite","PIPELINE_7":"gemini-3.5-flash-lite"}'::jsonb,
  graceful_model_fallback_enabled BOOLEAN NOT NULL DEFAULT true,
  free_storage_quota_bytes BIGINT NOT NULL DEFAULT 52428800, -- 50 MB
  pro_storage_quota_bytes BIGINT NOT NULL DEFAULT 2147483648, -- 2 GB
  max_file_size_bytes BIGINT NOT NULL DEFAULT 10485760, -- 10 MB
  max_video_duration_seconds SMALLINT NOT NULL DEFAULT 30,
  ai_rate_limit_per_min SMALLINT NOT NULL DEFAULT 5,
  min_required_app_version TEXT NOT NULL DEFAULT '1.0.0',
  logical_day_rollover_hour SMALLINT NOT NULL DEFAULT 4,
  offline_sync_grace_hours SMALLINT NOT NULL DEFAULT 12,
  referral_reward_days SMALLINT NOT NULL DEFAULT 7,
  max_monthly_referral_days SMALLINT NOT NULL DEFAULT 30,
  free_roadmap_allowance SMALLINT NOT NULL DEFAULT 1,
  pro_roadmap_allowance SMALLINT NOT NULL DEFAULT 3,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 22 (audit): admin_audit_log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NULL REFERENCES public.users(id),
  admin_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason_note TEXT NOT NULL,
  before_json JSONB NULL,
  after_json JSONB NULL,
  ip_address INET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. GOAL & JOURNEY EXECUTION TABLES
-- ============================================================================

-- Table 3: goals
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  why VARCHAR(350) NOT NULL,
  category TEXT NOT NULL REFERENCES public.goal_categories(slug) DEFAULT 'OTHER',
  execution_mode TEXT NOT NULL DEFAULT 'deliverable_queue' CHECK (execution_mode IN ('deliverable_queue', 'daily_quota')),
  plan_style TEXT NOT NULL DEFAULT 'FLEXIBLE_WEEK' CHECK (plan_style IN ('FLEXIBLE_WEEK', 'DAILY_ADAPTIVE')),
  streak_weeks INTEGER NOT NULL DEFAULT 0,
  current_week_number SMALLINT NOT NULL DEFAULT 1,
  last_activity_date DATE NULL,
  is_mvg_shrunk BOOLEAN NOT NULL DEFAULT false,
  current_baseline_text VARCHAR(500) NOT NULL,
  custom_week_intent VARCHAR(300) NULL,
  deadline DATE NOT NULL,
  hours_per_day NUMERIC(3,1) NOT NULL CHECK (hours_per_day BETWEEN 0.5 AND 8.0),
  working_days SMALLINT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED')),
  user_state TEXT NOT NULL DEFAULT 'STEADY' CHECK (user_state IN ('STEADY', 'SLIPPING', 'STRUGGLING', 'AHEAD', 'OVERLOADED')),
  user_persona_profile_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  today_context_line VARCHAR(140) NULL,
  paused_until DATE NULL,
  pause_reason TEXT NULL,
  total_paused_days SMALLINT NOT NULL DEFAULT 0,
  locked_date DATE NULL,
  week_start_day SMALLINT NOT NULL DEFAULT 6,
  last_synced_logical_date DATE NULL,
  day_time_map_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  journey_memory_json JSONB NOT NULL DEFAULT '{"version":1,"items":[]}'::jsonb,
  memory_version INTEGER NOT NULL DEFAULT 1,
  previous_roadmap_json JSONB NULL,
  partner_email VARCHAR(150) NULL,
  missed_working_days_since_offer SMALLINT NOT NULL DEFAULT 0,
  consecutive_missed_working_days SMALLINT NOT NULL DEFAULT 0,
  comeback_weeks_count SMALLINT NOT NULL DEFAULT 0,
  last_miss_cause TEXT NULL,
  quiet_outreach_step SMALLINT NOT NULL DEFAULT 0,
  early_checkins_completed SMALLINT[] NOT NULL DEFAULT '{}',
  abandon_reason TEXT NULL,
  restructure_count SMALLINT NOT NULL DEFAULT 0,
  public_slug VARCHAR(32) UNIQUE NULL,
  visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (visibility IN ('PRIVATE', 'PUBLIC')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NULL,
  closed_at TIMESTAMPTZ NULL
);

-- Table 4: onboarding_answers
CREATE TABLE IF NOT EXISTS public.onboarding_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('FIXED', 'AI_FOLLOWUP', 'EARLY_CHECKIN_D3_D7_D14', 'EVENT_CHECKIN')),
  memory_scope_target TEXT NULL CHECK (memory_scope_target IS NULL OR memory_scope_target IN ('PERSON', 'DOMAIN', 'GOAL')),
  question_index SMALLINT NOT NULL,
  question_text TEXT NOT NULL,
  answer_text VARCHAR(500) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 5: milestones
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  position SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 8),
  title VARCHAR(100) NOT NULL,
  expected_result VARCHAR(250) NOT NULL,
  estimated_hours NUMERIC(5,1) NOT NULL,
  target_metric_value NUMERIC(8,2) NULL,
  target_metric_unit VARCHAR(20) NULL,
  status TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'ACTIVE', 'DONE')),
  competency_status TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (competency_status IN ('COMPLETED', 'CURRENT_FOCUS', 'DEVELOPING', 'NEEDS_REINFORCEMENT', 'UPCOMING')),
  result_feedback TEXT NULL CHECK (result_feedback IS NULL OR result_feedback IN ('MET_IT', 'NOT_QUITE')),
  prompt_version_id UUID NULL REFERENCES public.prompt_versions(id),
  reached_at TIMESTAMPTZ NULL,
  CONSTRAINT uq_milestones_goal_position UNIQUE (goal_id, position)
);

-- Table 6: tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  week_number SMALLINT NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'DELIVERABLE' CHECK (task_type IN ('DELIVERABLE', 'SETUP_DELIVERABLE', 'DAILY_CORE', 'WEEKLY_QUOTA', 'REALITY_CHECK')),
  adaptation_policy TEXT NOT NULL DEFAULT 'SLICE_STEPS' CHECK (adaptation_policy IN ('SLICE_STEPS', 'PRESERVE_DOSE_SWAP', 'MOVE_DAY', 'MEASUREMENT_ONLY')),
  sequence_order SMALLINT NOT NULL DEFAULT 1,
  target_count SMALLINT NOT NULL DEFAULT 1 CHECK (target_count BETWEEN 1 AND 7),
  completed_count SMALLINT NOT NULL DEFAULT 0 CHECK (completed_count >= 0 AND completed_count <= target_count),
  last_quota_logged_date DATE NULL,
  due_date DATE NULL,
  completed_at TIMESTAMPTZ NULL,
  title VARCHAR(120) NOT NULL,
  done_means VARCHAR(200) NOT NULL,
  how_to_steps_json JSONB NOT NULL DEFAULT '{"steps":[],"example":""}'::jsonb,
  min_version_10m VARCHAR(200) NOT NULL,
  why_it_matters VARCHAR(200) NOT NULL,
  used_context_ids TEXT[] NOT NULL DEFAULT '{}',
  estimate_minutes SMALLINT NOT NULL CHECK (estimate_minutes BETWEEN 5 AND 240),
  used_10m_version BOOLEAN NOT NULL DEFAULT false,
  is_stretch_task BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DONE', 'SKIPPED_BASIC', 'CARRIED', 'DROPPED')),
  skip_reason TEXT NULL CHECK (skip_reason IS NULL OR skip_reason IN ('TOO_BASIC', 'ALREADY_DONE')),
  carried_count SMALLINT NOT NULL DEFAULT 0,
  effort_rating TEXT NULL,
  effort_rated_at TIMESTAMPTZ NULL,
  stuck_reason TEXT NULL,
  marked_not_useful BOOLEAN NOT NULL DEFAULT false,
  original_task_json JSONB NULL,
  adaptation_reason VARCHAR(120) NULL,
  prompt_version_id UUID NULL REFERENCES public.prompt_versions(id)
);

-- Table 7: evidence
CREATE TABLE IF NOT EXISTS public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('NOTE', 'LINK', 'PHOTO', 'VIDEO', 'FILE')),
  storage_path TEXT NULL,
  external_url TEXT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  duration_seconds SMALLINT NULL CHECK (duration_seconds IS NULL OR duration_seconds <= 30),
  caption_note VARCHAR(500) NULL,
  measured_value NUMERIC(8,2) NULL,
  visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (visibility IN ('PRIVATE', 'PUBLIC')),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 8: day_notes
CREATE TABLE IF NOT EXISTS public.day_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  note_date DATE NOT NULL,
  text VARCHAR(500) NOT NULL,
  safety_status TEXT NOT NULL DEFAULT 'SAFE' CHECK (safety_status IN ('SAFE', 'DISTURBING_HELP', 'REFUSE_UNSAFE')),
  digested_in_plan BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_day_notes_goal_date UNIQUE (goal_id, note_date)
);

-- Table 9: weekly_reviews
CREATE TABLE IF NOT EXISTS public.weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  week_number SMALLINT NOT NULL,
  ai_summary TEXT NOT NULL,
  three_bullet_lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  on_track BOOLEAN NOT NULL DEFAULT true,
  plan_changes TEXT NULL,
  partner_share_line VARCHAR(160) NULL,
  milestone_competency_updates_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  memory_confirmation_prompt_json JSONB NULL,
  generation_key TEXT UNIQUE NOT NULL,
  job_status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (job_status IN ('CLAIMED', 'COMPLETED', 'FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_weekly_reviews_goal_week UNIQUE (goal_id, week_number)
);

-- Table 10: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('WEEKLY_SUMMARY', 'MILESTONE_REACHED', 'JOURNEY_CARD_EARNED', 'PRO_EXPIRY_7D', 'PRO_EXPIRY_1D')),
  title VARCHAR(120) NOT NULL,
  body VARCHAR(250) NOT NULL,
  target_screen TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 11: push_subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 12: journey_cards
CREATE TABLE IF NOT EXISTS public.journey_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID UNIQUE NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  public_slug VARCHAR(32) UNIQUE NOT NULL,
  journey_card_headline VARCHAR(120) NOT NULL,
  day1_vs_now_story VARCHAR(300) NOT NULL,
  comeback_highlight_line VARCHAR(150) NULL,
  where_i_was_note VARCHAR(160) NULL,
  featured_evidence_ids UUID[] NOT NULL DEFAULT '{}',
  next_goal_suggestions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (visibility IN ('PRIVATE', 'PUBLIC_LINK')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
  clap_count INTEGER NOT NULL DEFAULT 0,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ NULL
);

-- Table 13: referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) NOT NULL,
  referred_tasks_completed SMALLINT NOT NULL DEFAULT 0,
  reward_days_granted SMALLINT NOT NULL DEFAULT 0,
  reward_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (reward_status IN ('PENDING', 'GRANTED')),
  granted_at TIMESTAMPTZ NULL
);

-- ============================================================================
-- 4. FINANCIAL, MODERATION & TELEMETRY TABLES
-- ============================================================================

-- Table 14: payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  item_code TEXT NOT NULL REFERENCES public.pricing_plans(item_code),
  amount_bdt INTEGER NOT NULL,
  gateway TEXT NOT NULL CHECK (gateway IN ('UDDOKTAPAY', 'SSLCOMMERZ', 'BKASH')),
  gateway_transaction_id VARCHAR(100) UNIQUE NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'DUPLICATE')),
  verified_by_admin_id UUID NULL REFERENCES public.users(id),
  verification_note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NULL
);

-- Table 15: payment_events
CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NULL REFERENCES public.payments(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  raw_payload JSONB NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT false,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 16: refund_requests
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID UNIQUE NOT NULL REFERENCES public.payments(id),
  user_id UUID NOT NULL REFERENCES public.users(id),
  reason_code TEXT NOT NULL CHECK (reason_code IN ('DUPLICATE_CHARGE', 'UNLOCK_DELAY_OVER_24H')),
  submitted_trx_id VARCHAR(100) NOT NULL,
  user_note VARCHAR(500) NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'APPROVED', 'REJECTED')),
  decision_note TEXT NULL,
  decided_by_super_admin_id UUID NULL REFERENCES public.users(id),
  decided_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 20: ai_calls
CREATE TABLE IF NOT EXISTS public.ai_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  goal_id UUID NULL REFERENCES public.goals(id) ON DELETE SET NULL,
  pipeline TEXT NOT NULL CHECK (pipeline IN ('PIPELINE_1', 'PIPELINE_2', 'PIPELINE_3', 'PIPELINE_4', 'PIPELINE_5', 'PIPELINE_6', 'PIPELINE_7')),
  prompt_version_id UUID NOT NULL REFERENCES public.prompt_versions(id),
  model_name TEXT NOT NULL,
  tokens_in INTEGER NOT NULL,
  tokens_out INTEGER NOT NULL,
  cost_usd NUMERIC(10,6) NOT NULL,
  latency_ms INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'RETRIED_SUCCESS', 'SCHEMA_FAILED', 'API_ERROR')),
  error_code TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 21: support_tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'SUPPORT' CHECK (kind IN ('SUPPORT', 'FEEDBACK')),
  category_tag TEXT NOT NULL,
  message VARCHAR(1000) NOT NULL,
  app_version TEXT NULL,
  screen_path TEXT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'REPLIED', 'CLOSED')),
  admin_reply TEXT NULL,
  replied_by_admin_id UUID NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 22: reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('PUBLIC_TIMELINE', 'PUBLIC_JOURNEY_CARD')),
  target_id UUID NULL,
  target_slug TEXT NOT NULL,
  reason TEXT NOT NULL,
  reporter_note VARCHAR(300) NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED_TAKEDOWN', 'DISMISSED')),
  handled_by_admin_id UUID NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_status_role ON public.users(status, role);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON public.goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_goals_status_last_activity ON public.goals(status, last_activity_date);
CREATE INDEX IF NOT EXISTS idx_goals_public_slug ON public.goals(public_slug) WHERE visibility = 'PUBLIC';
CREATE INDEX IF NOT EXISTS idx_onboarding_answers_goal ON public.onboarding_answers(goal_id, stage, question_index);
CREATE INDEX IF NOT EXISTS idx_milestones_goal_status ON public.milestones(goal_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_goal_week_seq ON public.tasks(goal_id, week_number, sequence_order);
CREATE INDEX IF NOT EXISTS idx_tasks_goal_status ON public.tasks(goal_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_milestone_status ON public.tasks(milestone_id, status);
CREATE INDEX IF NOT EXISTS idx_evidence_goal_uploaded ON public.evidence(goal_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_user_uploaded ON public.evidence(user_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_day_notes_user_date ON public.day_notes(user_id, note_date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_trx ON public.payments(gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_ai_calls_created ON public.ai_calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_calls_user_created ON public.ai_calls(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_calls_prompt_version ON public.ai_calls(prompt_version_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_created ON public.support_tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);

-- ============================================================================
-- 6. TRIGGERS & INTEGRITY GUARDS
-- ============================================================================

-- Immutable Audit Log Trigger
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit log is append-only and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_audit_log_immutable ON public.admin_audit_log;
CREATE TRIGGER trg_admin_audit_log_immutable
BEFORE UPDATE OR DELETE ON public.admin_audit_log
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

-- User Protected Columns & Birth Year >= 18 Guard Trigger
CREATE OR REPLACE FUNCTION public.guard_user_protected_columns()
RETURNS TRIGGER AS $$
DECLARE
  is_service_role BOOLEAN;
  current_yr INTEGER;
BEGIN
  -- Determine whether execution context is privileged service_role or database admin
  is_service_role := (
    current_setting('request.jwt.claim.role', true) = 'service_role' OR
    current_setting('role', true) = 'service_role' OR
    session_user = 'postgres'
  );

  IF NOT is_service_role THEN
    -- If birth_year is already set non-null, client cannot change it
    IF OLD.birth_year IS NOT NULL AND NEW.birth_year IS DISTINCT FROM OLD.birth_year THEN
      RAISE EXCEPTION 'Cannot modify birth_year once set';
    END IF;

    -- If setting birth_year for the first time, enforce >= 18 years old
    IF OLD.birth_year IS NULL AND NEW.birth_year IS NOT NULL THEN
      current_yr := EXTRACT(YEAR FROM CURRENT_DATE);
      IF (current_yr - NEW.birth_year) < 18 THEN
        RAISE EXCEPTION 'User must be at least 18 years old to use Bunon';
      END IF;
    END IF;

    -- Guard sensitive role, status, and entitlement columns from non-service-role changes
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Unauthorized modification of role column';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Unauthorized modification of status column';
    END IF;
    IF NEW.pro_until IS DISTINCT FROM OLD.pro_until THEN
      RAISE EXCEPTION 'Unauthorized modification of pro_until column';
    END IF;
    IF NEW.pro_source IS DISTINCT FROM OLD.pro_source THEN
      RAISE EXCEPTION 'Unauthorized modification of pro_source column';
    END IF;
    IF NEW.streak_count IS DISTINCT FROM OLD.streak_count THEN
      RAISE EXCEPTION 'Unauthorized modification of streak_count column';
    END IF;
    IF NEW.streak_visible IS DISTINCT FROM OLD.streak_visible THEN
      RAISE EXCEPTION 'Unauthorized modification of streak_visible column';
    END IF;
    IF NEW.storage_used_bytes IS DISTINCT FROM OLD.storage_used_bytes THEN
      RAISE EXCEPTION 'Unauthorized modification of storage_used_bytes column';
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_user_protected_columns ON public.users;
CREATE TRIGGER trg_guard_user_protected_columns
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.guard_user_protected_columns();

-- ============================================================================
-- 7. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all 25 tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users_2fa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- 7.1 users RLS
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 7.2 goal_categories RLS (Public read active categories)
CREATE POLICY "goal_categories_select_active" ON public.goal_categories
  FOR SELECT USING (is_active = true);

-- 7.3 goals RLS
CREATE POLICY "goals_select" ON public.goals
  FOR SELECT USING (user_id = auth.uid() OR visibility = 'PUBLIC');

CREATE POLICY "goals_insert_own" ON public.goals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "goals_update_own" ON public.goals
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "goals_delete_own" ON public.goals
  FOR DELETE USING (user_id = auth.uid());

-- 7.4 onboarding_answers RLS
CREATE POLICY "onboarding_answers_all" ON public.onboarding_answers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.goals WHERE goals.id = onboarding_answers.goal_id AND goals.user_id = auth.uid())
  );

-- 7.5 milestones RLS
CREATE POLICY "milestones_select" ON public.milestones
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.goals WHERE goals.id = milestones.goal_id AND (goals.user_id = auth.uid() OR goals.visibility = 'PUBLIC'))
  );

CREATE POLICY "milestones_insert" ON public.milestones
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.goals WHERE goals.id = milestones.goal_id AND goals.user_id = auth.uid())
  );

CREATE POLICY "milestones_update" ON public.milestones
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.goals WHERE goals.id = milestones.goal_id AND goals.user_id = auth.uid())
  );

CREATE POLICY "milestones_delete" ON public.milestones
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.goals WHERE goals.id = milestones.goal_id AND goals.user_id = auth.uid())
  );

-- 7.6 tasks RLS
CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.goals WHERE goals.id = tasks.goal_id AND (goals.user_id = auth.uid() OR goals.visibility = 'PUBLIC'))
  );

CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.goals WHERE goals.id = tasks.goal_id AND goals.user_id = auth.uid())
  );

CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.goals WHERE goals.id = tasks.goal_id AND goals.user_id = auth.uid())
  );

CREATE POLICY "tasks_delete" ON public.tasks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.goals WHERE goals.id = tasks.goal_id AND goals.user_id = auth.uid())
  );

-- 7.7 evidence RLS
CREATE POLICY "evidence_select" ON public.evidence
  FOR SELECT USING (
    user_id = auth.uid() OR (
      visibility = 'PUBLIC' AND
      EXISTS (SELECT 1 FROM public.goals WHERE goals.id = evidence.goal_id AND goals.visibility = 'PUBLIC')
    )
  );

CREATE POLICY "evidence_insert_own" ON public.evidence
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "evidence_update_own" ON public.evidence
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "evidence_delete_own" ON public.evidence
  FOR DELETE USING (user_id = auth.uid());

-- 7.8 day_notes RLS (Strictly Private to Owner)
CREATE POLICY "day_notes_select_own" ON public.day_notes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "day_notes_insert_own" ON public.day_notes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "day_notes_update_own" ON public.day_notes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "day_notes_delete_own" ON public.day_notes
  FOR DELETE USING (user_id = auth.uid());

-- 7.9 weekly_reviews RLS
CREATE POLICY "weekly_reviews_select" ON public.weekly_reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.goals WHERE goals.id = weekly_reviews.goal_id AND goals.user_id = auth.uid())
  );

-- 7.10 notifications RLS
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- 7.11 push_subscriptions RLS
CREATE POLICY "push_subscriptions_all_own" ON public.push_subscriptions
  FOR ALL USING (user_id = auth.uid());

-- 7.12 journey_cards RLS
CREATE POLICY "journey_cards_select" ON public.journey_cards
  FOR SELECT USING (
    user_id = auth.uid() OR (visibility = 'PUBLIC_LINK' AND status = 'ACTIVE')
  );

CREATE POLICY "journey_cards_insert_own" ON public.journey_cards
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "journey_cards_update_own" ON public.journey_cards
  FOR UPDATE USING (user_id = auth.uid());

-- 7.13 referrals RLS
CREATE POLICY "referrals_select_own" ON public.referrals
  FOR SELECT USING (referrer_user_id = auth.uid() OR referred_user_id = auth.uid());

-- 7.14 pricing_plans RLS (Public read for paywall / checkout)
CREATE POLICY "pricing_plans_select_all" ON public.pricing_plans
  FOR SELECT USING (true);

-- 7.15 payments RLS
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (user_id = auth.uid());

-- 7.16 refund_requests RLS
CREATE POLICY "refund_requests_select_own" ON public.refund_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "refund_requests_insert_own" ON public.refund_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 7.17 support_tickets RLS
CREATE POLICY "support_tickets_select_own" ON public.support_tickets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "support_tickets_insert_own" ON public.support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 7.18 reports RLS (Public insert for abuse reports)
CREATE POLICY "reports_insert_public" ON public.reports
  FOR INSERT WITH CHECK (true);

-- ZERO client policies on system/admin/internal tables:
-- admin_users_2fa, payment_events, prompt_versions, regional_knowledge,
-- ai_calls, system_settings, and admin_audit_log remain inaccessible to client anon/auth JWTs.
