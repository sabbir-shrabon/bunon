/**
 * 1. Purpose: Zod validation schemas and inferred types matching locked output keys for Pipelines 1-7.
 * 2. Spec Ref: Prompt Catalog v2.5 Section 7 (Pipelines 1 to 7 Locked Output JSON Keys).
 * 3. Called By: AI Service Layer (firewall.ts, assembler.ts, and prompt runners).
 * 4. Calls: zod.
 */

import { z } from 'zod';

// Shared Memory Op Schema
export const MemoryOpSchema = z.object({
  op: z.enum(['UPSERT', 'RESOLVE', 'EXPIRE']),
  scope: z.enum(['PERSON', 'DOMAIN', 'GOAL']),
  bucket: z.enum([
    'knowledge_and_skill_gaps',
    'life_rhythm_and_constraints',
    'what_works_for_this_user',
    'mastered_foundations',
    'past_pivots_and_decisions',
  ]),
  fact: z.string(),
  source: z.enum(['day_note', 'user_confirmed', 'ai_inferred']),
  confidence: z.number().min(0).max(1),
  valid_until: z.string().nullable().optional(),
});
export type MemoryOp = z.infer<typeof MemoryOpSchema>;

// Pipeline 1: Onboarding Follow-ups
export const Pipeline1OnboardingFollowupsSchema = z.object({
  safety_status: z
    .enum(['SAFE', 'REFUSE_UNSAFE', 'DISTURBING_HELP'])
    .catch('SAFE'),
  safety_message: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? ''),
  detected_category: z.string().default('OTHER'),
  execution_mode: z
    .enum(['deliverable_queue', 'daily_quota'])
    .catch('deliverable_queue'),
  recommended_plan_style: z
    .enum(['FLEXIBLE_WEEK', 'DAILY_ADAPTIVE'])
    .catch('DAILY_ADAPTIVE'),
  followup_questions: z
    .array(
      z.object({
        question: z.string(),
        why_we_ask: z.string().nullable().optional().transform((v) => v ?? ''),
        quick_chips: z
          .array(z.string())
          .nullable()
          .optional()
          .transform((v) => v ?? []),
      })
    )
    .optional()
    .default([])
    .transform((arr) => (arr || []).slice(0, 3)),
  missing_context_boosters: z
    .array(z.string())
    .optional()
    .default([])
    .transform((arr) => (arr || []).slice(0, 3)),
});
export type Pipeline1Output = z.infer<typeof Pipeline1OnboardingFollowupsSchema>;

// Pipeline 2: Roadmap Generator
export const Pipeline2RoadmapGeneratorSchema = z.object({
  used_context_ids: z.array(z.string()).optional().default([]),
  milestones: z.array(
    z.object({
      position: z.number().int().min(1).max(12),
      title: z.string().max(140),
      expected_result: z.string().max(350),
      estimated_hours: z.coerce.number().positive().default(10),
      target_metric_value: z.number().nullable().optional(),
      target_metric_unit: z.string().nullable().optional(),
    })
  ).min(1).max(12),
});
export type Pipeline2Output = z.infer<typeof Pipeline2RoadmapGeneratorSchema>;

// Sub-step schema
const SubStepItemSchema = z.object({
  step_number: z.coerce.number().int().default(1),
  text: z.string().default(''),
  minutes: z.coerce.number().int().default(20),
});

// Pipeline 3: Weekly Planner
export const Pipeline3WeeklyPlannerSchema = z.object({
  is_milestone_final_week: z.boolean().catch(false),
  today_context_line: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v ?? '').slice(0, 140)),
  tasks: z
    .array(
      z.object({
        task_type: z
          .enum([
            'DELIVERABLE',
            'SETUP_DELIVERABLE',
            'DAILY_CORE',
            'WEEKLY_QUOTA',
            'REALITY_CHECK',
          ])
          .catch('DELIVERABLE'),
        adaptation_policy: z
          .enum([
            'SLICE_STEPS',
            'PRESERVE_DOSE_SWAP',
            'MOVE_DAY',
            'MEASUREMENT_ONLY',
          ])
          .catch('SLICE_STEPS'),
        sequence_order: z.coerce.number().int().default(1),
        target_count: z.coerce.number().int().default(1),
        milestone_position: z.coerce.number().int().default(1),
        title: z.string().default('Deliverable'),
        estimate_minutes: z.coerce.number().int().default(45),
        is_stretch_task: z.boolean().optional().default(false),
        done_means: z
          .string()
          .nullable()
          .optional()
          .transform((v) => (v ?? '').slice(0, 200)),
        how_to_steps: z
          .object({
            steps: z.array(SubStepItemSchema).optional().default([]),
            example: z
              .string()
              .nullable()
              .optional()
              .transform((v) => (v ?? '').slice(0, 200)),
          })
          .optional()
          .default({ steps: [], example: '' }),
        min_version_10m: z
          .string()
          .nullable()
          .optional()
          .transform((v) => (v ?? '').slice(0, 200)),
        why_it_matters: z
          .string()
          .nullable()
          .optional()
          .transform((v) => (v ?? '').slice(0, 200)),
        used_context_ids: z.array(z.string()).optional().default([]),
      })
    )
    .min(1)
    .max(10),
  proposed_memory_ops: z.array(MemoryOpSchema).optional().default([]),
});
export type Pipeline3Output = z.infer<typeof Pipeline3WeeklyPlannerSchema>;

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
