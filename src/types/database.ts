/**
 * 1. Purpose: Master Supabase Database TypeScript schema contract mapping all 22+ tables.
 * 2. Spec Ref: Database Schema v2.5 Section 5 (All 22 Tables Overview & RLS).
 * 3. Called By: src/lib/db/client.ts, src/lib/db/server.ts, and src/lib/db/admin.ts.
 * 4. Calls: src/types/db sub-modules.
 */

import type {
  UserRow,
  UserInsert,
  UserUpdate,
  AdminUsers2faRow,
  AdminUsers2faInsert,
  AdminUsers2faUpdate,
  NotificationRow,
  NotificationInsert,
  NotificationUpdate,
  PushSubscriptionRow,
  PushSubscriptionInsert,
  PushSubscriptionUpdate,
  ReferralRow,
  ReferralInsert,
  ReferralUpdate,
} from './db/user-tables';

import type {
  GoalRow,
  GoalInsert,
  GoalUpdate,
  OnboardingAnswerRow,
  OnboardingAnswerInsert,
  OnboardingAnswerUpdate,
  MilestoneRow,
  MilestoneInsert,
  MilestoneUpdate,
  TaskRow,
  TaskInsert,
  TaskUpdate,
} from './db/goal-tables';

import type {
  EvidenceRow,
  EvidenceInsert,
  EvidenceUpdate,
  DayNoteRow,
  DayNoteInsert,
  DayNoteUpdate,
  WeeklyReviewRow,
  WeeklyReviewInsert,
  WeeklyReviewUpdate,
  JourneyCardRow,
  JourneyCardInsert,
  JourneyCardUpdate,
} from './db/evidence-tables';

import type {
  GoalCategoryRow,
  GoalCategoryInsert,
  GoalCategoryUpdate,
  PricingPlanRow,
  PricingPlanInsert,
  PricingPlanUpdate,
  PaymentRow,
  PaymentInsert,
  PaymentUpdate,
  PaymentEventRow,
  PaymentEventInsert,
  RefundRequestRow,
  RefundRequestInsert,
  RefundRequestUpdate,
} from './db/system-tables';

import type {
  PromptVersionRow,
  PromptVersionInsert,
  PromptVersionUpdate,
  RegionalKnowledgeRow,
  RegionalKnowledgeInsert,
  RegionalKnowledgeUpdate,
  AICallRow,
  AICallInsert,
  SupportTicketRow,
  SupportTicketInsert,
  SupportTicketUpdate,
  ReportRow,
  ReportInsert,
  ReportUpdate,
  SystemSettingsRow,
  SystemSettingsUpdate,
  AdminAuditLogRow,
  AdminAuditLogInsert,
} from './db/admin-tables';

export * from './db/user-tables';
export * from './db/goal-tables';
export * from './db/evidence-tables';
export * from './db/system-tables';
export * from './db/admin-tables';

type Table<Row, Insert, Update> = {
  Row: Row & Record<string, unknown>;
  Insert: Insert & Record<string, unknown>;
  Update: Update & Record<string, unknown>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      users: Table<UserRow, UserInsert, UserUpdate>;
      admin_users_2fa: Table<AdminUsers2faRow, AdminUsers2faInsert, AdminUsers2faUpdate>;
      goal_categories: Table<GoalCategoryRow, GoalCategoryInsert, GoalCategoryUpdate>;
      goals: Table<GoalRow, GoalInsert, GoalUpdate>;
      onboarding_answers: Table<OnboardingAnswerRow, OnboardingAnswerInsert, OnboardingAnswerUpdate>;
      milestones: Table<MilestoneRow, MilestoneInsert, MilestoneUpdate>;
      tasks: Table<TaskRow, TaskInsert, TaskUpdate>;
      evidence: Table<EvidenceRow, EvidenceInsert, EvidenceUpdate>;
      day_notes: Table<DayNoteRow, DayNoteInsert, DayNoteUpdate>;
      weekly_reviews: Table<WeeklyReviewRow, WeeklyReviewInsert, WeeklyReviewUpdate>;
      notifications: Table<NotificationRow, NotificationInsert, NotificationUpdate>;
      push_subscriptions: Table<PushSubscriptionRow, PushSubscriptionInsert, PushSubscriptionUpdate>;
      journey_cards: Table<JourneyCardRow, JourneyCardInsert, JourneyCardUpdate>;
      referrals: Table<ReferralRow, ReferralInsert, ReferralUpdate>;
      pricing_plans: Table<PricingPlanRow, PricingPlanInsert, PricingPlanUpdate>;
      payments: Table<PaymentRow, PaymentInsert, PaymentUpdate>;
      payment_events: Table<PaymentEventRow, PaymentEventInsert, Record<string, never>>;
      refund_requests: Table<RefundRequestRow, RefundRequestInsert, RefundRequestUpdate>;
      prompt_versions: Table<PromptVersionRow, PromptVersionInsert, PromptVersionUpdate>;
      regional_knowledge: Table<RegionalKnowledgeRow, RegionalKnowledgeInsert, RegionalKnowledgeUpdate>;
      ai_calls: Table<AICallRow, AICallInsert, Record<string, never>>;
      support_tickets: Table<SupportTicketRow, SupportTicketInsert, SupportTicketUpdate>;
      reports: Table<ReportRow, ReportInsert, ReportUpdate>;
      system_settings: Table<SystemSettingsRow, Record<string, never>, SystemSettingsUpdate>;
      admin_audit_log: Table<AdminAuditLogRow, AdminAuditLogInsert, Record<string, never>>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
