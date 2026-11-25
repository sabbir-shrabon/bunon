import 'server-only';
/**
 * 1. Purpose: Shared signal loader computing real tasks, proofs, day notes, and persona profile at $0 tokens.
 * 2. Spec Ref: Prompt Catalog v2.5 Rule 6 & Pipelines 3–6 Intelligence Signals.
 * 3. Called By: today-service, week-service, week-rollover-service, adjust route, and replan-service.
 * 4. Calls: Admin Supabase client and persona-engine.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { GoalRow, TaskRow } from '@/types/db/goal-tables';
import type { EvidenceRow } from '@/types/db/evidence-tables';
import { evaluatePersonaProfile, type PersonaProfile } from './persona-engine';

export interface RecentDayNoteSignal {
  note_date: string;
  text: string;
  digested_in_plan: boolean;
}

export interface EffortRatingsSummary {
  easy: number;
  right: number;
  hard: number;
  total: number;
}

export interface FlaggedNotUsefulTask {
  title: string;
  stuck_reason: string | null;
}

export interface RealityCheckMeasurement {
  value: number;
  note: string;
  uploaded_at: string;
}

export interface GoalIntelligenceSignals {
  persona: PersonaProfile;
  recentDayNotes: RecentDayNoteSignal[];
  effortRatingsSummary: EffortRatingsSummary;
  flaggedNotUsefulTasks: FlaggedNotUsefulTask[];
  realityCheckMeasurements: RealityCheckMeasurement[];
  totalWeeks: number;
  remainingWeeks: number;
  availableHoursRemaining: number;
}

function clampInt(val: number, min: number, max: number, fallback: number): number {
  return Number.isFinite(val) ? Math.max(min, Math.min(max, Math.ceil(val))) : fallback;
}

export async function loadGoalIntelligenceSignals(params: {
  supabaseAdmin: SupabaseClient<Database>;
  goal: GoalRow;
}): Promise<GoalIntelligenceSignals> {
  const { supabaseAdmin, goal } = params;
  const minWeek = Math.max(1, (goal.current_week_number || 1) - 2);

  const [{ data: rawTasks }, { data: rawEvidence }, { data: undigestedNotes }, { data: latestNotes }] =
    await Promise.all([
      supabaseAdmin.from('tasks').select('*').eq('goal_id', goal.id).gte('week_number', minWeek),
      supabaseAdmin
        .from('evidence')
        .select('id, type, measured_value, caption_note, uploaded_at')
        .eq('goal_id', goal.id)
        .order('uploaded_at', { ascending: false })
        .limit(10),
      supabaseAdmin
        .from('day_notes')
        .select('note_date, text, digested_in_plan')
        .eq('goal_id', goal.id)
        .eq('digested_in_plan', false)
        .order('note_date', { ascending: false }),
      supabaseAdmin
        .from('day_notes')
        .select('note_date, text, digested_in_plan')
        .eq('goal_id', goal.id)
        .order('note_date', { ascending: false })
        .limit(10),
    ]);

  const tasks = (rawTasks || []) as unknown as TaskRow[];
  const evidence = rawEvidence || [];

  const noteSeen = new Set<string>();
  const recentDayNotes: RecentDayNoteSignal[] = [];
  for (const n of [...(undigestedNotes || []), ...(latestNotes || [])]) {
    const key = `${n.note_date}:${n.text}`;
    if (noteSeen.has(key)) continue;
    noteSeen.add(key);
    recentDayNotes.push({
      note_date: n.note_date,
      text: n.text,
      digested_in_plan: Boolean(n.digested_in_plan),
    });
  }
  recentDayNotes.sort((a, b) => b.note_date.localeCompare(a.note_date));

  const effortRatingsSummary: EffortRatingsSummary = { easy: 0, right: 0, hard: 0, total: 0 };
  const flaggedNotUsefulTasks: FlaggedNotUsefulTask[] = [];
  for (const t of tasks) {
    const rating = t.effort_rating?.toLowerCase();
    if (rating === 'easy' || rating === 'right' || rating === 'hard') {
      effortRatingsSummary[rating] += 1;
      effortRatingsSummary.total += 1;
    }
    if (t.marked_not_useful === true) {
      flaggedNotUsefulTasks.push({ title: t.title, stuck_reason: t.stuck_reason ?? null });
    }
  }

  const realityCheckMeasurements: RealityCheckMeasurement[] = evidence
    .filter((e) => e.measured_value != null)
    .map((e) => ({
      value: Number(e.measured_value),
      note: e.caption_note ?? '',
      uploaded_at: e.uploaded_at,
    }));

  const weekMs = 7 * 86400000;
  const startMs = new Date(goal.locked_date || goal.created_at).getTime();
  const endMs = new Date(goal.deadline).getTime();
  const totalWeeks = clampInt((endMs - startMs) / weekMs, 4, 52, 12);
  const remainingWeeks = clampInt((endMs - Date.now()) / weekMs, 1, 52, 4);
  const workingDaysCount = Math.max(1, (goal.working_days || []).length);
  const availableHoursRemaining = Math.round(remainingWeeks * workingDaysCount * (Number(goal.hours_per_day) || 1));

  const persona = evaluatePersonaProfile({
    scheduledWorkingDays: goal.working_days || [0, 1, 2, 3, 4],
    lastActivityDate: goal.last_activity_date || null,
    tasksLast14Days: tasks,
    evidenceLast10: evidence as unknown as EvidenceRow[],
  });

  try {
    const nextProfile = persona as unknown as Record<string, unknown>;
    const changed =
      persona.user_state !== goal.user_state ||
      JSON.stringify(nextProfile) !== JSON.stringify(goal.user_persona_profile_json || {});
    if (changed) {
      await supabaseAdmin
        .from('goals')
        .update({ user_state: persona.user_state, user_persona_profile_json: nextProfile })
        .eq('id', goal.id);
    }
  } catch (err) {
    console.warn('[Bunon Signals] Persona persist skipped:', err instanceof Error ? err.message : String(err));
  }

  return {
    persona,
    recentDayNotes,
    effortRatingsSummary,
    flaggedNotUsefulTasks,
    realityCheckMeasurements,
    totalWeeks,
    remainingWeeks,
    availableHoursRemaining,
  };
}
