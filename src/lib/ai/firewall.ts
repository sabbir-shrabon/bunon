import 'server-only';
/**
 * 1. Purpose: Enforces the 4-Gate AI Token Firewall before calling Google Gemini.
 * 2. Spec Ref: Database Schema v2.5 Section 2 (Gates 1, 2, 3, 4).
 * 3. Called By: AI Service Layer assembler and route handlers.
 * 4. Calls: Admin Supabase client and system settings.
 */

import { createAdminClient } from '@/lib/db/admin';
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

  // --- Gate 1: Active User & Input Caps ---
  const { data: user, error: userError } = await admin
    .from('users')
    .select('id, status, role, pro_until')
    .eq('id', params.userId)
    .single();

  if (userError || !user || user.status !== 'ACTIVE') {
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
  }

  // --- Gate 2: Sliding-Window Rate Limiter ---
  if (!params.isRetry) {
    const userAllowed = checkRateWindow(userRateLimits, params.userId, 5);
    if (!userAllowed) {
      return { allowed: false, model: '', reason: 'RATE_LIMITED', retryAfterSeconds: 30 };
    }
    if (params.userIp) {
      const ipAllowed = checkRateWindow(ipRateLimits, params.userIp, 10);
      if (!ipAllowed) {
        return { allowed: false, model: '', reason: 'RATE_LIMITED', retryAfterSeconds: 30 };
      }
    }
  }

  // --- Gate 3: Feature Allowance Check ---
  const isPro = Boolean(user.pro_until && new Date(user.pro_until) > new Date());

  if (params.pipeline === 'PIPELINE_2' && params.goalId && !params.isRetry) {
    const { data: goal } = await admin
      .from('goals')
      .select('previous_roadmap_json')
      .eq('id', params.goalId)
      .maybeSingle();

    // If regeneration (previous_roadmap_json exists), check allowance
    if (goal?.previous_roadmap_json && !isPro) {
      // Free user already used their 1 free regeneration
      return { allowed: false, model: '', reason: 'ALLOWANCE_EXCEEDED' };
    }
  }

  // --- Gate 4: Spend Caps & Graceful Model Downgrade ---
  const { data: settings } = await admin
    .from('system_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (settings?.ai_kill_switch) {
    return { allowed: false, model: '', reason: 'AI_KILL_SWITCH_ACTIVE' };
  }

  // Calculate today's spend from ai_calls
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data: dailyCalls } = await admin
    .from('ai_calls')
    .select('cost_usd')
    .gte('created_at', todayStart.toISOString());

  const dailySpend = (dailyCalls || []).reduce((acc, c) => acc + (Number(c.cost_usd) || 0), 0);
  const dailyCap = settings?.global_daily_ai_cap_usd || 5.0;

  // Determine target model
  const defaultModel =
    settings?.pipeline_models_json?.[params.pipeline] ||
    settings?.active_gemini_model ||
    'gemini-3.5-flash-lite';

  let selectedModel = defaultModel;

  // Normalize legacy/deprecated models that Gemini API rejects for new users
  if (selectedModel.includes('2.5') || selectedModel.includes('2.0') || selectedModel.includes('1.5')) {
    selectedModel = 'gemini-3.5-flash-lite';
  }

  // Check 80% threshold for graceful downgrade
  if (dailySpend >= dailyCap * 0.8) {
    if (settings?.graceful_model_fallback_enabled ?? true) {
      selectedModel = 'gemini-3.5-flash-lite';
    } else if (dailySpend >= dailyCap) {
      return { allowed: false, model: '', reason: 'DAILY_CAP_EXCEEDED' };
    }
  }

  return {
    allowed: true,
    model: selectedModel,
    sanitizedInputs: sanitized,
  };
}
