/**
 * 1. Purpose: Request schema validation and normalization for the lock-and-plan onboarding route.
 * 2. Spec Ref: Prompt Catalog v2.5 Pipeline 3 & Two-Path Onboarding context memory persistence.
 * 3. Called By: src/app/api/onboarding/lock-and-plan/route.ts.
 * 4. Calls: zod.
 */

import { z } from 'zod';

export function normalizeReminderTime(val?: string | null): string | undefined {
  if (!val) return undefined;
  const trimmed = val.trim();
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    const h = match24[1].padStart(2, '0');
    const m = match24[2];
    const s = match24[3] || '00';
    return `${h}:${m}:${s}`;
  }
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2];
    const modifier = match12[3].toUpperCase();
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
  }
  return trimmed;
}

export function parseWorkingDays(val: unknown): number[] {
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'number') return item;
        if (typeof item === 'string') {
          const n = parseInt(item, 10);
          return isNaN(n) ? null : n;
        }
        if (typeof item === 'object' && item !== null && 'index' in item) {
          const n = Number((item as { index: unknown }).index);
          return isNaN(n) ? null : n;
        }
        return null;
      })
      .filter((n): n is number => n !== null);
  }
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  }
  return [];
}

export const MilestoneInputSchema = z.object({
  position: z.preprocess((v) => {
    const n = Number(v);
    return isNaN(n) || n < 1 ? 1 : Math.round(n);
  }, z.number().int().min(1).default(1)),
  title: z.preprocess((v) => {
    return typeof v === 'string' ? v.trim() : String(v || '').trim();
  }, z.string().min(1, 'Milestone title is required')),
  expected_result: z.preprocess((v) => {
    return typeof v === 'string' ? v.trim() : String(v || '').trim();
  }, z.string().default('')),
  estimated_hours: z.preprocess((v) => {
    const n = Number(v);
    return isNaN(n) || n <= 0 ? 10 : n;
  }, z.number().positive().default(10)),
  target_metric_value: z.preprocess((v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }, z.number().nullable().optional().default(null)),
  target_metric_unit: z.preprocess((v) => {
    if (v === null || v === undefined || v === '') return null;
    return String(v).trim();
  }, z.string().nullable().optional().default(null)),
});

export const ConfirmedMemoryFactSchema = z.object({
  scope: z.enum(['PERSON', 'GOAL']),
  bucket: z.enum([
    'knowledge_and_skill_gaps',
    'life_rhythm_and_constraints',
    'what_works_for_this_user',
    'mastered_foundations',
    'past_pivots_and_decisions',
  ]),
  fact: z.string().min(1).max(250),
});

export type ConfirmedMemoryFact = z.infer<typeof ConfirmedMemoryFactSchema>;

export const LockAndPlanRequestSchema = z.object({
  goalTitle: z.string().optional(),
  goal_title: z.string().optional(),
  goalWhy: z.string().optional(),
  goal_why: z.string().optional(),
  goalCategory: z.string().optional(),
  goal_category: z.string().optional(),
  category: z.string().optional(),
  executionMode: z.enum(['deliverable_queue', 'daily_quota']).optional(),
  execution_mode: z.enum(['deliverable_queue', 'daily_quota']).optional(),
  planStyle: z.enum(['FLEXIBLE_WEEK', 'DAILY_ADAPTIVE']).optional(),
  plan_style: z.enum(['FLEXIBLE_WEEK', 'DAILY_ADAPTIVE']).optional(),
  outlineMode: z.enum(['FOLLOW_OUTLINE', 'BACKGROUND_CONTEXT']).optional(),
  outline_mode: z.enum(['FOLLOW_OUTLINE', 'BACKGROUND_CONTEXT']).optional(),
  extractedOutlineSummary: z.string().nullable().optional(),
  extracted_outline_summary: z.string().nullable().optional(),
  confirmedMemoryFacts: z.array(ConfirmedMemoryFactSchema).optional(),
  confirmed_memory_facts: z.array(ConfirmedMemoryFactSchema).optional(),
  deadlineDate: z.string().optional(),
  deadline_date: z.string().optional(),
  deadline: z.string().optional(),
  totalWeeks: z.coerce.number().int().positive().optional(),
  total_weeks: z.coerce.number().int().positive().optional(),
  hoursPerDay: z.coerce.number().positive().optional(),
  hours_per_day: z.coerce.number().positive().optional(),
  workingDays: z.preprocess((val) => parseWorkingDays(val), z.array(z.number()).optional()),
  working_days: z.preprocess((val) => parseWorkingDays(val), z.array(z.number()).optional()),
  currentBaseline: z.preprocess((v) => (v === null || v === undefined ? '' : String(v)), z.string().default('')),
  current_baseline: z.preprocess((v) => (v === null || v === undefined ? '' : String(v)), z.string().default('')),
  constraints: z.preprocess((v) => (v === null || v === undefined ? '' : String(v)), z.string().default('')),
  milestones: z.array(MilestoneInputSchema).min(1, 'At least one milestone is required in roadmap'),
  used_context_ids: z.array(z.string()).optional().default([]),
  boosters: z.array(z.string()).optional().default([]),
  reminderTime: z.string().optional(),
  reminder_time: z.string().optional(),
  previousRoadmapJson: z.unknown().optional(),
  previous_roadmap_json: z.unknown().optional(),
  day_time_map: z.unknown().optional(),
  day_time_map_json: z.unknown().optional(),
  dayTimeMap: z.unknown().optional(),
  followupAnswers: z.unknown().optional(),
  followup_qa: z.unknown().optional(),
  followupQa: z.unknown().optional(),
  onboarding_answers: z.unknown().optional(),
  onboardingAnswers: z.unknown().optional(),
}).superRefine((data, ctx) => {
  const title = (data.goalTitle || data.goal_title || '').trim();
  if (!title) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Goal title is required', path: ['goalTitle'] });
  }
  const why = (data.goalWhy || data.goal_why || '').trim();
  if (!why) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Goal why is required', path: ['goalWhy'] });
  }
  const deadline = (data.deadlineDate || data.deadline_date || data.deadline || '').trim();
  if (!deadline) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Deadline date is required', path: ['deadlineDate'] });
  }
  const days = (data.workingDays && data.workingDays.length > 0)
    ? data.workingDays
    : (data.working_days && data.working_days.length > 0)
      ? data.working_days
      : [];
  if (days.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'At least one working day is required', path: ['workingDays'] });
  }
});

export type LockAndPlanRequestBody = z.infer<typeof LockAndPlanRequestSchema>;
