/**
 * 1. Purpose: Common Zod sub-schemas (MemoryOpSchema, SubStepItemSchema) shared across AI pipelines.
 * 2. Spec Ref: Prompt Catalog v2.5 Section 7.
 * 3. Called By: src/types/ai-schemas.ts, src/types/ai-schemas-lifecycle.ts.
 * 4. Calls: zod.
 */

import { z } from 'zod';

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

export const SubStepItemSchema = z.object({
  step_number: z.coerce.number().int().default(1),
  text: z.string().default(''),
  minutes: z.coerce.number().int().default(20),
});
export type SubStepItem = z.infer<typeof SubStepItemSchema>;
