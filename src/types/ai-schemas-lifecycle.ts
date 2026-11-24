/**
 * 1. Purpose: Zod validation schemas and types for Pipelines 4 to 7 (lifecycle, adjustments, reviews).
 * 2. Spec Ref: Prompt Catalog v2.5 Section 7 (Pipelines 4, 5, 6, 7).
 * 3. Called By: src/types/ai-schemas.ts and lifecycle service runners.
 * 4. Calls: zod, MemoryOpSchema, SubStepItemSchema.
 */

import { z } from 'zod';
import { MemoryOpSchema, SubStepItemSchema } from './ai-schemas-common';

// Pipeline 4: Daily Adjuster
export const Pipeline4DailyAdjusterSchema = z.object({
  safety_status: z.enum(['SAFE', 'REFUSE_UNSAFE', 'DISTURBING_HELP']),
  safety_message: z.string(),
  adjustment_needed: z.boolean(),
  adaptation_action: z.enum(['SLICE', 'SWAP', 'MOVE', 'REWRITE', 'NONE']),
  coach_note: z.string().max(140),
  adaptation_reason: z.string().max(120),
  today_context_line: z.string().max(140),
  updated_tasks: z.array(
    z.object({
      task_id: z.string(),
      title: z.string().max(120),
      target_count: z.number().int().min(1).max(7),
      estimate_minutes: z.number().int().min(5).max(240),
      done_means: z.string().max(200),
      how_to_steps: z.object({
        steps: z.array(SubStepItemSchema).min(3).max(6),
        example: z.string().max(200),
      }),
      min_version_10m: z.string().max(200),
      why_it_matters: z.string().max(200),
      used_context_ids: z.array(z.string()).default([]),
    })
  ),
  proposed_memory_ops: z.array(MemoryOpSchema).optional().default([]),
});
export type Pipeline4Output = z.infer<typeof Pipeline4DailyAdjusterSchema>;

// Pipeline 5: Weekly Review
export const Pipeline5WeeklyReviewSchema = z.object({
  ai_summary: z.string(),
  three_bullet_lines: z.array(z.string()).length(3),
  then_vs_now_line: z.string().max(200),
  partner_share_line: z.string().max(160),
  photocard_witty_line: z.string().max(160),
  on_track: z.boolean(),
  needs_journey_replan: z.boolean().default(false),
  suggest_dose_adjustment: z.boolean().default(false),
  dose_adjustment_prompt: z.string().nullable().optional(),
  plan_changes: z.string().default(''),
  memory_confirmation_question: z.object({
    memory_id: z.string(),
    scope: z.enum(['PERSON', 'DOMAIN', 'GOAL']),
    fact: z.string(),
    question_text: z.string(),
  }).nullable().optional(),
  milestone_competency_updates: z.array(
    z.object({
      milestone_position: z.number().int().min(1).max(8),
      competency_status: z.enum([
        'COMPLETED',
        'CURRENT_FOCUS',
        'DEVELOPING',
        'NEEDS_REINFORCEMENT',
        'UPCOMING',
      ]),
    })
  ),
  proposed_memory_ops: z.array(MemoryOpSchema).optional().default([]),
});
export type Pipeline5Output = z.infer<typeof Pipeline5WeeklyReviewSchema>;

// Pipeline 6: Re-plan
export const Pipeline6ReplanSchema = z.object({
  replan_summary: z.string().max(250),
  used_context_ids: z.array(z.string()).default([]),
  revised_remaining_milestones: z.array(
    z.object({
      position: z.number().int().min(1).max(8),
      title: z.string().max(100),
      expected_result: z.string().max(250),
      estimated_hours: z.number().positive(),
      target_metric_value: z.number().nullable().optional(),
      target_metric_unit: z.string().nullable().optional(),
    })
  ).min(1).max(8),
});
export type Pipeline6Output = z.infer<typeof Pipeline6ReplanSchema>;

// Pipeline 7: Next Goal Bridge
export const Pipeline7NextGoalBridgeSchema = z.object({
  journey_card_headline: z.string().max(120),
  photocard_witty_line: z.string().max(140),
  day1_vs_now_story: z.string().max(300),
  comeback_highlight_line: z.string().max(150).optional().default(''),
  partner_finish_share_line: z.string().max(160).optional().default(''),
  next_goal_suggestions: z.array(
    z.object({
      suggested_title: z.string().max(150),
      suggested_why: z.string().max(350),
      suggested_category: z.string(),
      suggested_execution_mode: z.enum(['deliverable_queue', 'daily_quota']),
      suggested_weeks: z.number().int().min(2).max(52),
      why_this_fits_you: z.string().max(250),
    })
  ).length(3),
});
export type Pipeline7Output = z.infer<typeof Pipeline7NextGoalBridgeSchema>;
