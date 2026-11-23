/**
 * 1. Purpose: Domain enums, states, and business constants for the Bunon core system.
 * 2. Spec Ref: Database Schema v2.5 Section 5, Prompt Catalog v2.5, & Master Plan.
 * 3. Called By: Database row types, AI schemas, UI components, and business services.
 * 4. Calls: None (Pure TypeScript type definitions and constants).
 */

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type CoachingTone = 'GENTLE' | 'STRAIGHT' | 'SHORT';
export type SupportedLanguage = 'EN' | 'BN';
export type AppTheme = 'LIGHT' | 'DARK';

export type UserState =
  | 'STEADY'
  | 'SLIPPING'
  | 'STRUGGLING'
  | 'AHEAD'
  | 'OVERLOADED';

export type ExecutionMode = 'deliverable_queue' | 'daily_quota';
export type PlanStyle = 'FLEXIBLE_WEEK' | 'DAILY_ADAPTIVE';

export type GoalStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ABANDONED';

export type GoalVisibility = 'PRIVATE' | 'PUBLIC';

export type OnboardingStage =
  | 'FIXED'
  | 'AI_FOLLOWUP'
  | 'EARLY_CHECKIN_D3_D7_D14'
  | 'EVENT_CHECKIN';

export type MemoryScope = 'PERSON' | 'DOMAIN' | 'GOAL';

export type MemoryBucket =
  | 'knowledge_and_skill_gaps'
  | 'life_rhythm_and_constraints'
  | 'what_works_for_this_user'
  | 'mastered_foundations'
  | 'past_pivots_and_decisions';

export type MemorySource = 'day_note' | 'user_confirmed' | 'ai_inferred';
export type MemoryOpType = 'UPSERT' | 'RESOLVE' | 'EXPIRE';

export type MilestoneStatus = 'UPCOMING' | 'ACTIVE' | 'DONE';

export type MilestoneCompetencyStatus =
  | 'COMPLETED'
  | 'CURRENT_FOCUS'
  | 'DEVELOPING'
  | 'NEEDS_REINFORCEMENT'
  | 'UPCOMING';

export type MilestoneResultFeedback = 'MET_IT' | 'NOT_QUITE';

export type TaskType =
  | 'DELIVERABLE'
  | 'SETUP_DELIVERABLE'
  | 'DAILY_CORE'
  | 'WEEKLY_QUOTA'
  | 'REALITY_CHECK';

export type AdaptationPolicy =
  | 'SLICE_STEPS'
  | 'PRESERVE_DOSE_SWAP'
  | 'MOVE_DAY'
  | 'MEASUREMENT_ONLY';

export type TaskStatus =
  | 'PENDING'
  | 'DONE'
  | 'SKIPPED_BASIC'
  | 'CARRIED'
  | 'DROPPED';

export type TaskSkipReason = 'TOO_BASIC' | 'ALREADY_DONE';

export type EvidenceType = 'NOTE' | 'LINK' | 'PHOTO' | 'VIDEO' | 'FILE';
export type EvidenceVisibility = 'PRIVATE' | 'PUBLIC';

export type DayNoteSafetyStatus =
  | 'SAFE'
  | 'DISTURBING_HELP'
  | 'REFUSE_UNSAFE';

export type NotificationType =
  | 'WEEKLY_SUMMARY'
  | 'MILESTONE_REACHED'
  | 'JOURNEY_CARD_EARNED'
  | 'PRO_EXPIRY_7D'
  | 'PRO_EXPIRY_1D';

export type JourneyCardVisibility = 'PRIVATE' | 'PUBLIC_LINK';
export type JourneyCardStatus = 'ACTIVE' | 'REVOKED';

export type ProItemCode =
  | 'PASS_1M'
  | 'PASS_3M'
  | 'PASS_6M'
  | 'PASS_12M';

export type PaymentGateway = 'UDDOKTAPAY' | 'SSLCOMMERZ' | 'BKASH';

export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'DUPLICATE';

export type RefundReasonCode =
  | 'DUPLICATE_CHARGE'
  | 'UNLOCK_DELAY_OVER_24H';

export type RefundStatus = 'OPEN' | 'APPROVED' | 'REJECTED';

export type PromptLayer = 'CORE' | 'SKILL' | 'REGIONAL' | 'PIPELINE';

export type AIPipelineKey =
  | 'PIPELINE_1'
  | 'PIPELINE_2'
  | 'PIPELINE_3'
  | 'PIPELINE_4'
  | 'PIPELINE_5'
  | 'PIPELINE_6'
  | 'PIPELINE_7';

export type AICallStatus =
  | 'SUCCESS'
  | 'RETRIED_SUCCESS'
  | 'SCHEMA_FAILED'
  | 'API_ERROR';

export type SupportTicketKind = 'SUPPORT' | 'FEEDBACK';
export type SupportTicketStatus = 'OPEN' | 'REPLIED' | 'CLOSED';

export type ReportTargetType = 'PUBLIC_TIMELINE' | 'PUBLIC_JOURNEY_CARD';
export type ReportStatus = 'OPEN' | 'RESOLVED_TAKEDOWN' | 'DISMISSED';

export type VelocityTrend =
  | 'ACCELERATING'
  | 'DECELERATING'
  | 'STALLED'
  | 'STEADY';

export type RhythmPattern =
  | 'BURST_SPRINTER'
  | 'LATE_NIGHT_FINISHER'
  | 'WEEKDAY_PINCHED'
  | 'DAILY_MICRO_GRINDER';

export type FrictionType =
  | 'SCOPE_INTIMIDATION'
  | 'BOREDOM_SKIPPER'
  | 'TIME_CRUNCHED'
  | 'TRUST_MISMATCH';

export type ProofAffinity =
  | 'VISUAL_PHOTO_VIDEO'
  | 'BUILDER_LINK_FILE'
  | 'QUICK_TEXT_NOTE';

export type StuckReason =
  | 'TOO_TIRED'
  | 'DID_NOT_UNDERSTAND'
  | 'NO_TIME'
  | 'NOT_USEFUL'
  | 'LOW_MOTIVATION';

export type MissCause =
  | 'LIFE_BUSY'
  | 'SYSTEM_TASKS'
  | 'TIRED'
  | 'CONFUSED';

export type AdaptationAction = 'SLICE' | 'SWAP' | 'MOVE' | 'REWRITE' | 'NONE';

export interface PersonMemoryItem {
  id: string;
  scope: MemoryScope;
  bucket: MemoryBucket;
  fact: string;
  source: MemorySource;
  confidence: number;
  pinned: boolean;
  locked_by_user: boolean;
  updated_at: string;
  valid_until: string | null;
}

export interface PersonMemoryData {
  version: number;
  items: PersonMemoryItem[];
}

export interface DayTimeMapEntry {
  available_minutes: number;
  observed_capacity?: number;
}

export type DayTimeMap = Record<string, DayTimeMapEntry>;

export interface SubStepItem {
  step_number: number;
  text: string;
  minutes: number;
  done: boolean;
  done_at: string | null;
}

export interface HowToStepsData {
  steps: SubStepItem[];
  example: string;
}

export interface SlicedStep extends SubStepItem {
  is_today_slice: boolean;
}

export interface StepSlicerResult {
  steps: SlicedStep[];
  todaySliceCount: number;
  isTodaySliceDone: boolean;
  restBannerMessage: string | null;
}

export interface MemoryItem {
  id: string;
  scope: 'PERSON' | 'DOMAIN' | 'GOAL';
  bucket:
    | 'knowledge_and_skill_gaps'
    | 'life_rhythm_and_constraints'
    | 'what_works_for_this_user'
    | 'mastered_foundations'
    | 'past_pivots_and_decisions';
  fact: string;
  source: 'day_note' | 'user_confirmed' | 'ai_inferred';
  confidence: number;
  pinned: boolean;
  locked_by_user: boolean;
  category?: string | null;
  created_at?: string;
  updated_at?: string;
  valid_until?: string | null;
}

