import 'server-only';
/**
 * 1. Purpose: Domain service for evaluating the contextual 6-level Today banner slot.
 * 2. Spec Ref: Database Schema v2.5 Section 5 & Category C Screens 24-25c.
 * 3. Called By: today-service getTodayPlan.
 * 4. Calls: persona-engine countMissedWorkingDays.
 */

import { countMissedWorkingDays, type PersonaProfile } from '@/lib/ai/persona-engine';
import type { GoalRow, MilestoneRow } from '@/types/db/goal-tables';

export type ContextBannerType =
  | 'MILESTONE_REACHED_60'
  | 'WELCOME_BACK_24'
  | 'NEW_WEEK_25'
  | 'DAY_CHECKIN_25A'
  | 'REMINDER_NUDGE_25C'
  | 'AHEAD_STRETCH_25B'
  | null;

export interface ContextBannerData {
  type: ContextBannerType;
  title?: string;
  subtitle?: string;
  chips?: string[];
  meta?: Record<string, unknown>;
}

export function evaluateContextBanner(
  goal: GoalRow,
  persona: PersonaProfile,
  isWeekDone: boolean,
  milestone: MilestoneRow | null
): ContextBannerData | null {
  // 1. Milestone Reached State 60
  if (milestone?.status === 'DONE') {
    return {
      type: 'MILESTONE_REACHED_60',
      title: 'Milestone reached',
      subtitle: milestone.expected_result,
    };
  }

  // 2. Welcome Back State 24
  const missedDays = countMissedWorkingDays(goal.last_activity_date, goal.working_days || [0, 1, 2, 3, 4]);
  if (missedDays > 0) {
    const chips = ['Got busy', "Tasks didn't feel right", 'Too tired', "Didn't know where to start"];
    return {
      type: 'WELCOME_BACK_24',
      title: 'Welcome back',
      subtitle: missedDays >= 7
        ? 'Life got busy — your plan is still solid. Move deadline or re-plan?'
        : 'Life got busy — your plan is still solid. Here is a light step for today.',
      chips,
      meta: { missedDays, severe: missedDays >= 7 },
    };
  }

  // 3. New Week State 25
  if (goal.current_week_number > 1 && !isWeekDone) {
    return {
      type: 'NEW_WEEK_25',
      title: `Week ${goal.current_week_number}`,
      subtitle: 'Here is your plan for this week. Keep steady cadence.',
    };
  }

  // 4. Ahead Stretch Offer State 25b
  if (persona.user_state === 'AHEAD') {
    return {
      type: 'AHEAD_STRETCH_25B',
      title: 'Ahead of schedule',
      subtitle: 'You are moving fast this week. Want an optional stretch step, or keep it light?',
      chips: ['Show stretch step', 'Keep it light'],
    };
  }

  return null;
}
