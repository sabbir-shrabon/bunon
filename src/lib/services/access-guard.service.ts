import 'server-only';
/**
 * 1. Purpose: Centralized runtime access guards for maintenance mode (Screen 118),
 *    account suspension (Screen 122), and live Pro entitlement checks.
 * 2. Spec Ref: Database Schema v2.5 (users.status, system_settings.full_maintenance_mode).
 * 3. Called By: Authenticated Server Pages and AI / mutation API route handlers.
 * 4. Calls: Admin Supabase client, system-settings.service, entitlement helpers.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/admin';
import { isUserProActive } from '@/lib/auth/entitlement';
import { getSystemSettings } from '@/lib/services/system-settings.service';
import type { SystemSettingsRow } from '@/types/db/admin-tables';
import type { SupportedLanguage, UserStatus } from '@/types/domain';

export interface UserAccessProfile {
  id: string;
  status: UserStatus;
  pro_until: string | null;
  isPro: boolean;
  language: SupportedLanguage;
  country: string;
}

export interface PageAccessResult {
  blocked: 'MAINTENANCE' | 'SUSPENDED' | 'DELETED' | null;
  settings: SystemSettingsRow;
  profile: UserAccessProfile | null;
}

export async function getUserAccessProfile(userId: string): Promise<UserAccessProfile | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('users')
    .select('id, status, pro_until, language, country')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    status: (data.status as UserStatus) || 'ACTIVE',
    pro_until: data.pro_until ?? null,
    isPro: isUserProActive(data.pro_until),
    language: data.language === 'BN' ? 'BN' : 'EN',
    country: data.country || 'BD',
  };
}

export async function getPageAccessState(
  userId?: string | null,
  options?: { allowSuspended?: boolean; allowMaintenance?: boolean }
): Promise<PageAccessResult> {
  const [settings, profile] = await Promise.all([
    getSystemSettings(),
    userId ? getUserAccessProfile(userId) : Promise.resolve(null),
  ]);

  if (settings.full_maintenance_mode && !options?.allowMaintenance) {
    return { blocked: 'MAINTENANCE', settings, profile };
  }

  if (profile?.status === 'SUSPENDED' && !options?.allowSuspended) {
    return { blocked: 'SUSPENDED', settings, profile };
  }

  if (profile?.status === 'DELETED') {
    return { blocked: 'DELETED', settings, profile };
  }

  return { blocked: null, settings, profile };
}

export interface ApiGuardSuccess {
  ok: true;
  settings: SystemSettingsRow;
  profile: UserAccessProfile;
}

export interface ApiGuardBlocked {
  ok: false;
  response: NextResponse;
}

export async function guardApiRoute(
  userId: string,
  options?: { allowSuspended?: boolean; allowMaintenance?: boolean }
): Promise<ApiGuardSuccess | ApiGuardBlocked> {
  const { blocked, settings, profile } = await getPageAccessState(userId, options);

  if (blocked === 'MAINTENANCE') {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'MAINTENANCE_MODE',
          state: 'SCREEN_118',
          message:
            'Bunon is taking a brief pause for maintenance. Your progress is safe — please try again shortly.',
        },
        { status: 503 }
      ),
    };
  }

  if (blocked === 'SUSPENDED') {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'ACCOUNT_SUSPENDED',
          state: 'SCREEN_122',
          message: 'Your account has been suspended.',
        },
        { status: 403 }
      ),
    };
  }

  if (!profile || blocked === 'DELETED') {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'USER_INACTIVE',
          message: 'Your account is not active.',
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true, settings, profile };
}

export function formatAIFirewallHttpError(reason?: string, retryAfterSeconds?: number): {
  status: number;
  body: Record<string, unknown>;
} {
  switch (reason) {
    case 'RATE_LIMITED':
      return {
        status: 429,
        body: {
          error: 'RATE_LIMITED',
          retry_after_seconds: retryAfterSeconds ?? 30,
          message: 'Please wait a moment before making another AI request.',
        },
      };
    case 'AI_KILL_SWITCH_ACTIVE':
    case 'DAILY_CAP_EXCEEDED':
      return {
        status: 503,
        body: {
          error: reason,
          state: 'STATE_118',
          message:
            'Bunon AI generation is briefly paused right now. Your Today tasks, proofs, and Timeline continue working normally.',
        },
      };
    case 'MAINTENANCE_MODE':
      return {
        status: 503,
        body: {
          error: 'MAINTENANCE_MODE',
          state: 'SCREEN_118',
          message:
            'Bunon is taking a brief pause for maintenance. Please try again shortly.',
        },
      };
    case 'MONTHLY_CAP_EXCEEDED':
      return {
        status: 429,
        body: {
          error: 'MONTHLY_CAP_EXCEEDED',
          state: 'STATE_118',
          message:
            'You have reached this month’s AI adjustment allowance. Your Today tasks, proofs, and Timeline continue working normally.',
        },
      };
    case 'ACCOUNT_SUSPENDED':
      return {
        status: 403,
        body: {
          error: 'ACCOUNT_SUSPENDED',
          state: 'SCREEN_122',
          message: 'Your account has been suspended.',
        },
      };
    default:
      return {
        status: 403,
        body: {
          error: reason || 'FIREWALL_BLOCKED',
          message: 'This action is currently unavailable.',
        },
      };
  }
}
