import 'server-only';
/**
 * 1. Purpose: Pure domain service for $0 zero-token Day Note logging and 0ms crisis safety checking.
 * 2. Spec Ref: Database Schema v2.5 Section 5.2 Table 8 & Stitch Screen 34/Screen 16.
 * 3. Called By: Day note API route, Today service, and future MCP server tools.
 * 4. Calls: Admin Supabase client and crisis regex rules.
 */

import { createAdminClient } from '@/lib/db/admin';
import type { DayNoteRow } from '@/types/db/evidence-tables';
import type { DayNoteSafetyStatus } from '@/types/domain';

// 0ms deterministic English + Bangla crisis/self-harm markers
const CRISIS_REGEX =
  /(suicide|kill\s*myself|end\s*my\s*life|want\s*to\s*die|self[-\s]*harm|hurting\s*myself|cut\s*myself|take\s*my\s*own\s*life|আত্মহত্যা|মরে\s*যেতে\s*চাই|নিজেকে\s*মেরে|জীবন\s*শেষ|শেষ\s*করে\s*দিতে\s*চাই|বাঁচতে\s*চাই\s*না)/i;

export interface LogDayNoteResult {
  success: boolean;
  dayNote?: DayNoteRow;
  safetyStatus: DayNoteSafetyStatus;
  helplineRequired: boolean;
  helplineMessage?: string;
  error?: string;
}

export async function logDayNote(
  userId: string,
  goalId: string,
  text: string
): Promise<LogDayNoteResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      success: false,
      safetyStatus: 'SAFE',
      helplineRequired: false,
      error: 'NOTE_EMPTY',
    };
  }

  const isCrisis = CRISIS_REGEX.test(trimmed);
  const safetyStatus: DayNoteSafetyStatus = isCrisis ? 'DISTURBING_HELP' : 'SAFE';

  const admin = createAdminClient();
  const todayStr = new Date().toISOString().split('T')[0];

  // Verify goal ownership
  const { data: goal } = await admin
    .from('goals')
    .select('id, user_id')
    .eq('id', goalId)
    .single();

  if (!goal || goal.user_id !== userId) {
    return {
      success: false,
      safetyStatus,
      helplineRequired: false,
      error: 'GOAL_NOT_FOUND',
    };
  }

  // Upsert note for today at $0 token cost
  const { data: upserted, error } = await admin
    .from('day_notes')
    .upsert(
      {
        goal_id: goalId,
        user_id: userId,
        note_date: todayStr,
        text: trimmed.slice(0, 500),
        safety_status: safetyStatus,
        digested_in_plan: false,
      },
      { onConflict: 'goal_id,note_date' }
    )
    .select()
    .single();

  if (error) {
    return {
      success: false,
      safetyStatus,
      helplineRequired: false,
      error: error.message,
    };
  }

  if (isCrisis) {
    return {
      success: true,
      dayNote: upserted as unknown as DayNoteRow,
      safetyStatus: 'DISTURBING_HELP',
      helplineRequired: true,
      helplineMessage:
        'If you or someone you know is going through a tough time, support is available right now. In Bangladesh call Kaan Pete Roi at +8801779554391 or 999. In the US/Canada call 988. In the UK call 111. You are not alone.',
    };
  }

  return {
    success: true,
    dayNote: upserted as unknown as DayNoteRow,
    safetyStatus: 'SAFE',
    helplineRequired: false,
  };
}

export async function getTodayDayNote(
  userId: string,
  goalId: string
): Promise<DayNoteRow | null> {
  const admin = createAdminClient();
  const todayStr = new Date().toISOString().split('T')[0];

  const { data, error } = await admin
    .from('day_notes')
    .select('*')
    .eq('goal_id', goalId)
    .eq('user_id', userId)
    .eq('note_date', todayStr)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as DayNoteRow;
}
