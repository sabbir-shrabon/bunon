import 'server-only';
/**
 * 1. Purpose: Deterministic $0 persona, friction, rhythm, and user_state evaluator for the last 14 days.
 * 2. Spec Ref: Prompt Catalog v2.5 Rule 6 Persona & Win-Directive Algorithm.
 * 3. Called By: Today service, weekly planner, daily adjuster, and re-plan pipelines.
 * 4. Calls: Pure date/math logic and domain types.
 */

import type { UserState } from '@/types/domain';
import type { TaskRow } from '@/types/db/goal-tables';
import type { EvidenceRow } from '@/types/db/evidence-tables';

export interface PersonaProfile {
  velocity_trend: 'ACCELERATING' | 'DECELERATING' | 'STALLED' | 'STEADY';
  rhythm_pattern: 'BURST_SPRINTER' | 'LATE_NIGHT_FINISHER' | 'WEEKDAY_PINCHED' | 'DAILY_MICRO_GRINDER';
  friction_type: 'SCOPE_INTIMIDATION' | 'BOREDOM_SKIPPER' | 'TIME_CRUNCHED' | 'TRUST_MISMATCH' | 'NONE';
  proof_affinity: 'VISUAL_PHOTO_VIDEO' | 'BUILDER_LINK_FILE' | 'QUICK_TEXT_NOTE';
  user_state: UserState;
  win_strategy_directive: string;
}

export interface PersonaInput {
  scheduledWorkingDays: number[];
  lastActivityDate: string | null;
  tasksLast14Days: TaskRow[];
  evidenceLast10: EvidenceRow[];
  localHourOffset?: number;
}

export function evaluatePersonaProfile(input: PersonaInput): PersonaProfile {
  const now = new Date();
  const tasks = input.tasksLast14Days;
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

  // 1. Velocity Trend
  let wCurrMinutes = 0;
  let wPrevMinutes = 0;
  let used10mCount7d = 0;
  let completedCount7d = 0;

  for (const t of tasks) {
    if (!t.completed_at) continue;
    const compDate = new Date(t.completed_at);
    if (compDate >= sevenDaysAgo) {
      wCurrMinutes += t.estimate_minutes || 0;
      completedCount7d++;
      if (t.used_10m_version) used10mCount7d++;
    } else if (compDate >= fourteenDaysAgo) {
      wPrevMinutes += t.estimate_minutes || 0;
    }
  }

  const missedScheduledDays = countMissedWorkingDays(input.lastActivityDate, input.scheduledWorkingDays);
  const used10mRate7d = completedCount7d > 0 ? used10mCount7d / completedCount7d : 0;

  let velocityTrend: PersonaProfile['velocity_trend'] = 'STEADY';
  if (missedScheduledDays >= 3) {
    velocityTrend = 'STALLED';
  } else if (wPrevMinutes > 0 && wCurrMinutes >= 1.2 * wPrevMinutes) {
    velocityTrend = 'ACCELERATING';
  } else if ((wPrevMinutes > 0 && wCurrMinutes < 0.75 * wPrevMinutes) || used10mRate7d >= 0.4) {
    velocityTrend = 'DECELERATING';
  }

  // 2. Rhythm Pattern
  const dayMinutes = [0, 0, 0, 0, 0, 0, 0];
  const completionHours: number[] = [];

  for (const t of tasks) {
    if (!t.completed_at) continue;
    const d = new Date(t.completed_at);
    dayMinutes[d.getDay()] += t.estimate_minutes || 0;
    const h = (d.getUTCHours() + (input.localHourOffset ?? 6)) % 24;
    completionHours.push(h);
  }

  const totalMin = dayMinutes.reduce((a, b) => a + b, 0);
  const sortedDayMin = [...dayMinutes].sort((a, b) => b - a);
  const top2Share = totalMin > 0 ? (sortedDayMin[0] + sortedDayMin[1]) / totalMin : 0;

  completionHours.sort((a, b) => a - b);
  const medianHour = completionHours.length > 0 ? completionHours[Math.floor(completionHours.length / 2)] : 14;
  const isLateNight = medianHour >= 21 || medianHour <= 2;

  let rhythmPattern: PersonaProfile['rhythm_pattern'] = 'DAILY_MICRO_GRINDER';
  if (top2Share >= 0.7 && totalMin > 0) {
    rhythmPattern = 'BURST_SPRINTER';
  } else if (isLateNight && completionHours.length >= 3) {
    rhythmPattern = 'LATE_NIGHT_FINISHER';
  }

  // 3. Friction Type
  let frictionType: PersonaProfile['friction_type'] = 'NONE';
  const markedNotUsefulCount = tasks.filter((t) => t.marked_not_useful).length;
  const skippedBasicCount = tasks.filter((t) => t.status === 'SKIPPED_BASIC').length;
  const carriedTwiceCount = tasks.filter((t) => t.carried_count >= 2).length;
  const tooHardCount = tasks.filter((t) => t.effort_rating === 'hard' && (t.estimate_minutes || 0) >= 45).length;
  const tooEasyCount = tasks.filter((t) => t.effort_rating === 'easy').length;
  const ratedCount = tasks.filter((t) => t.effort_rating).length;

  if (markedNotUsefulCount >= 1) {
    frictionType = 'TRUST_MISMATCH';
  } else if (used10mRate7d >= 0.5) {
    frictionType = 'TIME_CRUNCHED';
  } else if (skippedBasicCount >= 2 || (ratedCount >= 4 && tooEasyCount / ratedCount >= 0.5)) {
    frictionType = 'BOREDOM_SKIPPER';
  } else if (carriedTwiceCount >= 1 || tooHardCount >= 1) {
    frictionType = 'SCOPE_INTIMIDATION';
  }

  // 4. Proof Affinity
  const evidences = input.evidenceLast10;
  let visualCount = 0;
  let builderCount = 0;
  let noteCount = 0;

  for (const e of evidences) {
    if (e.type === 'PHOTO' || e.type === 'VIDEO') visualCount++;
    else if (e.type === 'LINK' || e.type === 'FILE') builderCount++;
    else noteCount++;
  }

  let proofAffinity: PersonaProfile['proof_affinity'] = 'VISUAL_PHOTO_VIDEO';
  if (builderCount >= visualCount && builderCount >= noteCount) {
    proofAffinity = 'BUILDER_LINK_FILE';
  } else if (noteCount > visualCount && noteCount > builderCount) {
    proofAffinity = 'QUICK_TEXT_NOTE';
  }

  // 5. User State
  let userState: UserState = 'STEADY';
  if (velocityTrend === 'STALLED' || (missedScheduledDays >= 2 && carriedTwiceCount >= 1) || frictionType === 'TRUST_MISMATCH') {
    userState = 'STRUGGLING';
  } else if (missedScheduledDays >= 1) {
    userState = 'SLIPPING';
  } else if (frictionType === 'TIME_CRUNCHED' || frictionType === 'SCOPE_INTIMIDATION') {
    userState = 'OVERLOADED';
  } else if (velocityTrend === 'ACCELERATING' && missedScheduledDays === 0) {
    userState = 'AHEAD';
  }

  // 6. Win Strategy Directive
  const winStrategyDirective = buildWinDirective(userState, frictionType, rhythmPattern);

  return {
    velocity_trend: velocityTrend,
    rhythm_pattern: rhythmPattern,
    friction_type: frictionType,
    proof_affinity: proofAffinity,
    user_state: userState,
    win_strategy_directive: winStrategyDirective,
  };
}

export function countMissedWorkingDays(lastActivityDate: string | null, scheduledWorkingDays: number[]): number {
  if (!lastActivityDate) return 0;
  const last = new Date(lastActivityDate);
  const now = new Date();
  last.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  let missed = 0;
  const cursor = new Date(last);
  cursor.setDate(cursor.getDate() + 1);

  while (cursor < now) {
    const day = cursor.getDay();
    if (scheduledWorkingDays.includes(day)) {
      missed++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return missed;
}

function buildWinDirective(state: UserState, friction: PersonaProfile['friction_type'], rhythm: PersonaProfile['rhythm_pattern']): string {
  if (state === 'STRUGGLING') {
    return 'User is struggling. Provide 1 single concrete micro-step (<= 20m) with zero ambiguous research.';
  }
  if (state === 'SLIPPING') {
    return 'User missed recent working days. Welcome back warmly without guilt. Offer a lighter restart task.';
  }
  if (state === 'OVERLOADED' || friction === 'TIME_CRUNCHED') {
    return 'User is time-pinched. Keep daily tasks strictly under 30m and emphasize fast zero-prep alternatives.';
  }
  if (friction === 'BOREDOM_SKIPPER') {
    return 'User skips basic items quickly. Advance directly to tangible building or real-world output.';
  }
  if (state === 'AHEAD') {
    return 'User is moving fast and ahead of schedule. Offer an optional stretch step or praise momentum.';
  }
  if (rhythm === 'BURST_SPRINTER') {
    return 'User prefers weekend or cluster sprint days. Keep weekday steps light and cluster deliverables.';
  }
  return 'Maintain steady cadence. Clear 2-beat structure (Do -> Prove to finish).';
}
