import 'server-only';
/**
 * 1. Purpose: Enforces the 4-Gate AI Token Firewall before calling Google Gemini.
 * 2. Spec Ref: Database Schema v2.5 Section 2 (Gates 1, 2, 3, 4).
 * 3. Called By: AI Service Layer assembler and route handlers.
 * 4. Calls: Admin Supabase client and cached system_settings (TTL <= 60s).
 */

import { createAdminClient } from '@/lib/db/admin';
import { isUserProActive } from '@/lib/auth/entitlement';
import { getSystemSettings } from '@/lib/services/system-settings.service';
import type { AIPipelineKey } from '@/types/domain';

// In-memory sliding window rate limiter
interface RateLimitBucket {
  timestamps: number[];
}
const userRateLimits = new Map<string, RateLimitBucket>();
const ipRateLimits = new Map<string, RateLimitBucket>();

function checkRateWindow(
  map: Map<string, RateLimitBucket>,
  key: string,
  maxRequests: number,
  windowMs = 60000
): boolean {
  const now = Date.now();
  const bucket = map.get(key) || { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  if (bucket.timestamps.length >= maxRequests) {
    return false;
  }
  bucket.timestamps.push(now);
  map.set(key, bucket);
  return true;
}

export class AIFirewallError extends Error {
  readonly reason: string;
  readonly retryAfterSeconds?: number;

  constructor(reason: string, retryAfterSeconds?: number) {
    super(reason);
    this.name = 'AIFirewallError';
    this.reason = reason;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface FirewallCheckParams {
  userId: string;
  userIp?: string | null;
  pipeline: AIPipelineKey;
  goalId?: string | null;
  inputs?: {
    goalTitle?: string;
    goalWhy?: string;
    answers?: string[];
    dayNote?: string;
    pastedText?: string;
  };
  isRetry?: boolean;
}

export interface FirewallDecision {
  allowed: boolean;
  model: string;
  reason?: string;
  retryAfterSeconds?: number;
  sanitizedInputs?: {
    goalTitle?: string;
    goalWhy?: string;
    answers?: string[];
    dayNote?: string;
    pastedText?: string;
  };
}

export function sanitizeAndWrapInput(text: string, maxLen: number): string {
  const truncated = text.slice(0, maxLen).trim();
  // Strip control chars and wrap in XML delimiter
  const cleaned = truncated.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '');
  return `<user_input>${cleaned}</user_input>`;
}

export async function checkAIFirewall(
  params: FirewallCheckParams
): Promise<FirewallDecision> {
  const admin = createAdminClient();
  const settings = await getSystemSettings();

  if (settings.full_maintenance_mode) {
    return { allowed: false, model: '', reason: 'MAINTENANCE_MODE' };
  }

  // --- Gate 1: Active User & Input Caps ---
  const { data: user, error: userError } = await admin
    .from('users')
    .select('id, status, role, pro_until')
    .eq('id', params.userId)
    .single();

  if (userError || !user) {
    return { allowed: false, model: '', reason: 'USER_INACTIVE' };
  }

  if (user.status === 'SUSPENDED') {
    return { allowed: false, model: '', reason: 'ACCOUNT_SUSPENDED' };
  }

  if (user.status !== 'ACTIVE') {
    return { allowed: false, model: '', reason: 'USER_INACTIVE' };
  }

  const sanitized: FirewallDecision['sanitizedInputs'] = {};
  if (params.inputs) {
    if (params.inputs.goalTitle) {
      sanitized.goalTitle = sanitizeAndWrapInput(params.inputs.goalTitle, 150);
    }
    if (params.inputs.goalWhy) {
      sanitized.goalWhy = sanitizeAndWrapInput(params.inputs.goalWhy, 350);
    }
    if (params.inputs.answers) {
      sanitized.answers = params.inputs.answers.map((a) =>
        sanitizeAndWrapInput(a, 500)
      );
    }
    if (params.inputs.dayNote) {
      sanitized.dayNote = sanitizeAndWrapInput(params.inputs.dayNote, 500);
    }
    if (params.inputs.pastedText) {
      sanitized.pastedText = sanitizeAndWrapInput(params.inputs.pastedText, 8000);
    }
  }

  // --- Gate 2: Sliding-Window Rate Limiter (live ai_rate_limit_per_min) ---
  if (!params.isRetry) {
    const rateLimitPerMin = Math.max(1, Number(settings.ai_rate_limit_per_min) || 5);
    const userAllowed = checkRateWindow(userRateLimits, params.userId, rateLimitPerMin);
    if (!userAllowed) {
      return { allowed: false, model: '', reason: 'RATE_LIMITED', retryAfterSeconds: 30 };
    }
    if (params.userIp) {
      const ipLimit = Math.max(rateLimitPerMin * 2, 10);
      const ipAllowed = checkRateWindow(ipRateLimits, params.userIp, ipLimit);
      if (!ipAllowed) {
        return { allowed: false, model: '', reason: 'RATE_LIMITED', retryAfterSeconds: 30 };
      }
    }
  }

  // --- Gate 3: Feature Allowance Check ---
  const isPro = isUserProActive(user.pro_until);

  if (params.pipeline === 'PIPELINE_2' && params.goalId && !params.isRetry) {
    const { data: goal } = await admin
      .from('goals')
      .select('previous_roadmap_json')
      .eq('id', params.goalId)
      .maybeSingle();

    // If regeneration (previous_roadmap_json exists), check allowance
    if (goal?.previous_roadmap_json && !isPro) {
      return { allowed: false, model: '', reason: 'ALLOWANCE_EXCEEDED' };
    }
  }

  // --- Gate 4: Kill Switch, Daily & Monthly Spend Caps, Graceful Model Downgrade ---
  if (settings.ai_kill_switch) {
    return { allowed: false, model: '', reason: 'AI_KILL_SWITCH_ACTIVE' };
  }

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [{ data: dailyCalls }, { data: userMonthlyCalls }] = await Promise.all([
    admin
      .from('ai_calls')
      .select('cost_usd')
      .gte('created_at', todayStart.toISOString()),
    admin
      .from('ai_calls')
      .select('cost_usd')
      .eq('user_id', params.userId)
      .gte('created_at', monthStart.toISOString()),
  ]);

  const dailySpend = (dailyCalls || []).reduce((acc, c) => acc + (Number(c.cost_usd) || 0), 0);
  const userMonthlySpend = (userMonthlyCalls || []).reduce(
    (acc, c) => acc + (Number(c.cost_usd) || 0),
    0
  );

  const dailyCap = Number(settings.global_daily_ai_cap_usd) || 5.0;
  const monthlyCap = isPro
    ? Number(settings.pro_monthly_ai_cap_usd) || 0.8
    : Number(settings.free_monthly_ai_cap_usd) || 0.15;
  const gracefulFallback = settings.graceful_model_fallback_enabled ?? true;

  // Determine target model from live pipeline_models_json
  const defaultModel =
    settings.pipeline_models_json?.[params.pipeline] ||
    settings.active_gemini_model ||
    'gemini-3.5-flash-lite';

  let selectedModel = defaultModel;

  // Normalize legacy/deprecated models that Gemini API rejects
  if (selectedModel.includes('2.5') || selectedModel.includes('2.0') || selectedModel.includes('1.5')) {
    selectedModel = 'gemini-3.5-flash-lite';
  }

  // Global Daily Cap enforcement
  if (dailyCap > 0 && dailySpend >= dailyCap) {
    return { allowed: false, model: '', reason: 'DAILY_CAP_EXCEEDED' };
  }
  if (dailyCap > 0 && dailySpend >= dailyCap * 0.8 && gracefulFallback) {
    selectedModel = 'gemini-3.5-flash-lite';
  }

  // Per-User Monthly Cap enforcement (rations optional pipelines once reached)
  const isOptionalPipeline =
    params.pipeline === 'PIPELINE_4' ||
    params.pipeline === 'PIPELINE_6' ||
    (params.pipeline === 'PIPELINE_2' && Boolean(params.isRetry));

  if (monthlyCap > 0 && userMonthlySpend >= monthlyCap) {
    if (isOptionalPipeline || !gracefulFallback) {
      return { allowed: false, model: '', reason: 'MONTHLY_CAP_EXCEEDED' };
    }
    selectedModel = 'gemini-3.5-flash-lite';
  } else if (monthlyCap > 0 && userMonthlySpend >= monthlyCap * 0.8 && gracefulFallback) {
    selectedModel = 'gemini-3.5-flash-lite';
  }

  return {
    allowed: true,
    model: selectedModel,
    sanitizedInputs: sanitized,
  };
}
