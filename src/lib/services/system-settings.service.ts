import 'server-only';
/**
 * 1. Purpose: Reads live system_settings from Supabase with a short (<= 60s) TTL cache.
 * 2. Spec Ref: Database Schema v2.5 Table 22 (system_settings) & Admin Screen 142.
 * 3. Called By: AI Firewall, evidence-service, onboarding limits, and access guards.
 * 4. Calls: Admin Supabase client.
 */

import { createAdminClient } from '@/lib/db/admin';
import type { SystemSettingsRow } from '@/types/db/admin-tables';

export const SYSTEM_SETTINGS_CACHE_TTL_MS = 10_000; // 10s TTL (<= 60s)

export const DEFAULT_SYSTEM_SETTINGS: SystemSettingsRow = {
  id: 1,
  global_daily_ai_cap_usd: 5.0,
  free_monthly_ai_cap_usd: 0.15,
  pro_monthly_ai_cap_usd: 0.8,
  ai_kill_switch: false,
  full_maintenance_mode: false,
  active_gemini_model: 'gemini-3.5-flash-lite',
  pipeline_models_json: {
    PIPELINE_1: 'gemini-3.5-flash-lite',
    PIPELINE_1B: 'gemini-3.5-flash-lite',
    PIPELINE_2: 'gemini-3.5-flash-lite',
    PIPELINE_3: 'gemini-3.5-flash-lite',
    PIPELINE_4: 'gemini-3.5-flash-lite',
    PIPELINE_5: 'gemini-3.5-flash-lite',
    PIPELINE_6: 'gemini-3.5-flash-lite',
    PIPELINE_7: 'gemini-3.5-flash-lite',
  },
  graceful_model_fallback_enabled: true,
  free_storage_quota_bytes: 52_428_800,
  pro_storage_quota_bytes: 2_147_483_648,
  max_file_size_bytes: 10_485_760,
  max_video_duration_seconds: 30,
  ai_rate_limit_per_min: 5,
  min_required_app_version: '1.0.0',
  logical_day_rollover_hour: 4,
  offline_sync_grace_hours: 12,
  referral_reward_days: 7,
  max_monthly_referral_days: 30,
  free_roadmap_allowance: 1,
  pro_roadmap_allowance: 3,
  onboarding_context_max_files: 1,
  onboarding_context_max_file_size_bytes: 5_242_880,
  updated_at: new Date(0).toISOString(),
};

let cachedSettings: SystemSettingsRow | null = null;
let cachedAtMs = 0;

function normalizeSettings(raw: Partial<SystemSettingsRow> | null | undefined): SystemSettingsRow {
  if (!raw) return DEFAULT_SYSTEM_SETTINGS;

  const num = (val: unknown, fallback: number): number => {
    const parsed = Number(val);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };

  const posNum = (val: unknown, fallback: number): number => {
    const parsed = Number(val);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };

  const pipelineModels =
    raw.pipeline_models_json && typeof raw.pipeline_models_json === 'object'
      ? { ...DEFAULT_SYSTEM_SETTINGS.pipeline_models_json, ...raw.pipeline_models_json }
      : DEFAULT_SYSTEM_SETTINGS.pipeline_models_json;

  return {
    id: 1,
    global_daily_ai_cap_usd: num(raw.global_daily_ai_cap_usd, DEFAULT_SYSTEM_SETTINGS.global_daily_ai_cap_usd),
    free_monthly_ai_cap_usd: num(raw.free_monthly_ai_cap_usd, DEFAULT_SYSTEM_SETTINGS.free_monthly_ai_cap_usd),
    pro_monthly_ai_cap_usd: num(raw.pro_monthly_ai_cap_usd, DEFAULT_SYSTEM_SETTINGS.pro_monthly_ai_cap_usd),
    ai_kill_switch: Boolean(raw.ai_kill_switch ?? DEFAULT_SYSTEM_SETTINGS.ai_kill_switch),
    full_maintenance_mode: Boolean(raw.full_maintenance_mode ?? DEFAULT_SYSTEM_SETTINGS.full_maintenance_mode),
    active_gemini_model:
      typeof raw.active_gemini_model === 'string' && raw.active_gemini_model.trim()
        ? raw.active_gemini_model.trim()
        : DEFAULT_SYSTEM_SETTINGS.active_gemini_model,
    pipeline_models_json: pipelineModels,
    graceful_model_fallback_enabled:
      raw.graceful_model_fallback_enabled ?? DEFAULT_SYSTEM_SETTINGS.graceful_model_fallback_enabled,
    free_storage_quota_bytes: posNum(raw.free_storage_quota_bytes, DEFAULT_SYSTEM_SETTINGS.free_storage_quota_bytes),
    pro_storage_quota_bytes: posNum(raw.pro_storage_quota_bytes, DEFAULT_SYSTEM_SETTINGS.pro_storage_quota_bytes),
    max_file_size_bytes: posNum(raw.max_file_size_bytes, DEFAULT_SYSTEM_SETTINGS.max_file_size_bytes),
    max_video_duration_seconds: posNum(
      raw.max_video_duration_seconds,
      DEFAULT_SYSTEM_SETTINGS.max_video_duration_seconds
    ),
    ai_rate_limit_per_min: posNum(raw.ai_rate_limit_per_min, DEFAULT_SYSTEM_SETTINGS.ai_rate_limit_per_min),
    min_required_app_version:
      typeof raw.min_required_app_version === 'string' && raw.min_required_app_version
        ? raw.min_required_app_version
        : DEFAULT_SYSTEM_SETTINGS.min_required_app_version,
    logical_day_rollover_hour: num(
      raw.logical_day_rollover_hour,
      DEFAULT_SYSTEM_SETTINGS.logical_day_rollover_hour
    ),
    offline_sync_grace_hours: posNum(
      raw.offline_sync_grace_hours,
      DEFAULT_SYSTEM_SETTINGS.offline_sync_grace_hours
    ),
    referral_reward_days: posNum(raw.referral_reward_days, DEFAULT_SYSTEM_SETTINGS.referral_reward_days),
    max_monthly_referral_days: posNum(
      raw.max_monthly_referral_days,
      DEFAULT_SYSTEM_SETTINGS.max_monthly_referral_days
    ),
    free_roadmap_allowance: posNum(raw.free_roadmap_allowance, DEFAULT_SYSTEM_SETTINGS.free_roadmap_allowance),
    pro_roadmap_allowance: posNum(raw.pro_roadmap_allowance, DEFAULT_SYSTEM_SETTINGS.pro_roadmap_allowance),
    onboarding_context_max_files: posNum(
      raw.onboarding_context_max_files,
      DEFAULT_SYSTEM_SETTINGS.onboarding_context_max_files
    ),
    onboarding_context_max_file_size_bytes: posNum(
      raw.onboarding_context_max_file_size_bytes,
      DEFAULT_SYSTEM_SETTINGS.onboarding_context_max_file_size_bytes
    ),
    updated_at: typeof raw.updated_at === 'string' ? raw.updated_at : DEFAULT_SYSTEM_SETTINGS.updated_at,
  };
}

export async function getSystemSettings(options?: { fresh?: boolean }): Promise<SystemSettingsRow> {
  const now = Date.now();
  if (!options?.fresh && cachedSettings && now - cachedAtMs < SYSTEM_SETTINGS_CACHE_TTL_MS) {
    return cachedSettings;
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('system_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) {
      return cachedSettings ?? DEFAULT_SYSTEM_SETTINGS;
    }

    const normalized = normalizeSettings(data as unknown as Partial<SystemSettingsRow>);
    cachedSettings = normalized;
    cachedAtMs = now;
    return normalized;
  } catch {
    return cachedSettings ?? DEFAULT_SYSTEM_SETTINGS;
  }
}

export function invalidateSystemSettingsCache(): void {
  cachedSettings = null;
  cachedAtMs = 0;
}
