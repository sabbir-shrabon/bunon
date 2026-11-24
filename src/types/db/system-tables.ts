/**
 * 1. Purpose: Database row, insert, and update types for goal categories, pricing, and payments.
 * 2. Spec Ref: Database Schema v2.5 Section 5 (Tables 2, 13, 14, 15, 16).
 * 3. Called By: src/types/database.ts, client and server database services.
 * 4. Calls: src/types/domain.ts.
 */

import type {
  ProItemCode,
  PaymentGateway,
  PaymentStatus,
  RefundReasonCode,
  RefundStatus,
} from '../domain';

export interface GoalCategoryRow {
  slug: string;
  label_en: string;
  label_bn: string;
  detection_hint: string;
  skill_prompt_key: string | null;
  regional_context_json: Record<string, unknown>;
  is_active: boolean;
  is_default_fallback: boolean;
}

export type GoalCategoryInsert = Partial<GoalCategoryRow> & {
  slug: string;
  label_en: string;
  label_bn: string;
  detection_hint: string;
};

export type GoalCategoryUpdate = Partial<GoalCategoryRow>;

export interface PricingPlanRow {
  item_code: ProItemCode;
  title_en: string;
  title_bn: string;
  price_bdt: number;
  price_usd: number | null;
  original_price_bdt: number | null;
  badge_text_en: string | null;
  badge_text_bn: string | null;
  promo_starts_at: string | null;
  promo_ends_at: string | null;
  duration_days: number;
  is_recommended: boolean;
}

export type PricingPlanInsert = Partial<PricingPlanRow> & {
  item_code: ProItemCode;
  title_en: string;
  title_bn: string;
  price_bdt: number;
  duration_days: number;
};

export type PricingPlanUpdate = Partial<PricingPlanRow>;

export interface PaymentRow {
  id: string;
  user_id: string;
  item_code: ProItemCode;
  amount_bdt: number;
  gateway: PaymentGateway;
  gateway_transaction_id: string | null;
  status: PaymentStatus;
  verified_by_admin_id: string | null;
  verification_note: string | null;
  created_at: string;
  completed_at: string | null;
}

export type PaymentInsert = Omit<Partial<PaymentRow>, 'id' | 'created_at'> & {
  user_id: string;
  item_code: ProItemCode;
  amount_bdt: number;
  gateway: PaymentGateway;
};

export type PaymentUpdate = Partial<Omit<PaymentRow, 'id' | 'user_id' | 'created_at'>>;

export interface PaymentEventRow {
  id: string;
  payment_id: string | null;
  event_type: string;
  raw_payload: Record<string, unknown>;
  signature_valid: boolean;
  received_at: string;
}

export type PaymentEventInsert = Omit<Partial<PaymentEventRow>, 'id' | 'received_at'> & {
  event_type: string;
  raw_payload: Record<string, unknown>;
};

export interface RefundRequestRow {
  id: string;
  payment_id: string;
  user_id: string;
  reason_code: RefundReasonCode;
  submitted_trx_id: string;
  user_note: string | null;
  status: RefundStatus;
  decision_note: string | null;
  decided_by_super_admin_id: string | null;
  decided_at: string | null;
  created_at: string;
}

export type RefundRequestInsert = Omit<Partial<RefundRequestRow>, 'id' | 'created_at'> & {
  payment_id: string;
  user_id: string;
  reason_code: RefundReasonCode;
  submitted_trx_id: string;
};

export type RefundRequestUpdate = Partial<Omit<RefundRequestRow, 'id' | 'payment_id' | 'user_id' | 'created_at'>>;

export interface OnboardingContextLimits {
  maxFiles: number;
  maxFileSizeBytes: number;
}

export type { SystemSettingsRow, SystemSettingsUpdate } from './admin-tables';
