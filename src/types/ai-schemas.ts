/**
 * 1. Purpose: Zod validation schemas and inferred types matching locked output keys for Pipelines 1 to 3 & 1B.
 * 2. Spec Ref: Prompt Catalog v2.5 Section 7 (Pipelines 1, 1B, 2, 3) & Two-Path Onboarding Spec.
 * 3. Called By: AI Service Layer (firewall.ts, assembler.ts, onboarding routes, and prompt runners).
 * 4. Calls: zod, ai-schemas-lifecycle.
 */

import { z } from 'zod';
import { MemoryOpSchema, SubStepItemSchema } from './ai-schemas-common';

// Re-export common schemas
export * from './ai-schemas-common';

// Pipeline 1: Onboarding Follow-ups
export const Pipeline1OnboardingFollowupsSchema = z.object({
  safety_status: z.enum(['SAFE', 'REFUSE_UNSAFE', 'DISTURBING_HELP']).catch('SAFE'),
  safety_message: z.string().nullable().optional().transform((v) => v ?? ''),
  detected_category: z.string().default('OTHER'),
  execution_mode: z.enum(['deliverable_queue', 'daily_quota']).catch('deliverable_queue'),
  recommended_plan_style: z.enum(['FLEXIBLE_WEEK', 'DAILY_ADAPTIVE']).catch('DAILY_ADAPTIVE'),
  followup_questions: z
    .array(
      z.object({
        question: z.string(),
        why_we_ask: z.string().nullable().optional().transform((v) => v ?? ''),
        quick_chips: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
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

// Pipeline 1B: File & Notes Context Ingest
export const Pipeline1BOutputSchema = z.object({
  safety_status: z.enum(['SAFE', 'REFUSE_UNSAFE', 'DISTURBING_HELP']).catch('SAFE'),
  safety_message: z.string().nullable().optional().transform((v) => v ?? ''),
  detected_category: z.string().default('OTHER'),
  execution_mode: z.enum(['deliverable_queue', 'daily_quota']).catch('deliverable_queue'),
  recommended_plan_style: z.enum(['FLEXIBLE_WEEK', 'DAILY_ADAPTIVE']).catch('DAILY_ADAPTIVE'),
  extracted_goal_title: z.string().max(150).default(''),
  extracted_goal_why: z.string().max(350).default(''),
  extracted_baseline: z.string().max(500).default(''),
  extracted_constraints: z.string().max(350).default(''),
  condensed_outline_summary: z.string().max(1500).default(''),
  extracted_memory_facts: z
    .array(
      z.object({
        scope: z.enum(['PERSON', 'GOAL']),
        bucket: z.enum([
          'knowledge_and_skill_gaps',
          'life_rhythm_and_constraints',
          'what_works_for_this_user',
          'mastered_foundations',
          'past_pivots_and_decisions',
        ]),
        fact: z.string().max(250),
      })
    )
    .min(1)
    .max(10)
    .transform((arr) => arr.slice(0, 6)),
  followup_questions: z
    .array(
      z.object({
        question: z.string().max(200),
        why_we_ask: z.string().nullable().optional().transform((v) => v ?? ''),
        quick_chips: z.array(z.string()).default([]),
      })
    )
    .optional()
    .default([])
    .transform((arr) => (arr || []).slice(0, 2)),
});
export type Pipeline1BOutput = z.infer<typeof Pipeline1BOutputSchema>;

// Pipeline 2: Roadmap Generator
export const Pipeline2RoadmapGeneratorSchema = z.object({
  used_context_ids: z.array(z.string()).optional().default([]),
  milestones: z
    .array(
      z.object({
        position: z.number().int().min(1).max(12),
        title: z.string().max(140),
        expected_result: z.string().max(350),
        estimated_hours: z.coerce.number().positive().default(10),
        target_metric_value: z.number().nullable().optional(),
        target_metric_unit: z.string().nullable().optional(),
      })
    )
    .min(1)
    .max(12),
});
export type Pipeline2Output = z.infer<typeof Pipeline2RoadmapGeneratorSchema>;

// Pipeline 3: Weekly Planner
export const Pipeline3WeeklyPlannerSchema = z.object({
  is_milestone_final_week: z.boolean().catch(false),
  today_context_line: z.string().nullable().optional().transform((v) => (v ?? '').slice(0, 140)),
  tasks: z
    .array(
      z.object({
        task_type: z.enum(['DELIVERABLE', 'SETUP_DELIVERABLE', 'DAILY_CORE', 'WEEKLY_QUOTA', 'REALITY_CHECK']).catch('DELIVERABLE'),
        adaptation_policy: z.enum(['SLICE_STEPS', 'PRESERVE_DOSE_SWAP', 'MOVE_DAY', 'MEASUREMENT_ONLY']).catch('SLICE_STEPS'),
        sequence_order: z.coerce.number().int().default(1),
        target_count: z.coerce.number().int().default(1),
        milestone_position: z.coerce.number().int().default(1),
        title: z.string().default('Deliverable'),
        estimate_minutes: z.coerce.number().int().default(45),
        is_stretch_task: z.boolean().optional().default(false),
        done_means: z.string().nullable().optional().transform((v) => (v ?? '').slice(0, 200)),
        how_to_steps: z
          .object({
            steps: z.array(SubStepItemSchema).optional().default([]),
            example: z.string().nullable().optional().transform((v) => (v ?? '').slice(0, 200)),
          })
          .optional()
          .default({ steps: [], example: '' }),
        min_version_10m: z.string().nullable().optional().transform((v) => (v ?? '').slice(0, 200)),
        why_it_matters: z.string().nullable().optional().transform((v) => (v ?? '').slice(0, 200)),
        used_context_ids: z.array(z.string()).optional().default([]),
      })
    )
    .min(1)
    .max(10),
  proposed_memory_ops: z.array(MemoryOpSchema).optional().default([]),
});
export type Pipeline3Output = z.infer<typeof Pipeline3WeeklyPlannerSchema>;

// Export lifecycle pipelines (Pipelines 4, 5, 6, 7)
export * from './ai-schemas-lifecycle';
