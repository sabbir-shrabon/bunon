/**
 * 1. Purpose: Helper operations for the lock-and-plan onboarding route (orphan cleanup, memory facts, answers).
 * 2. Spec Ref: Prompt Catalog v2.5 Pipeline 3 & Two-Path Onboarding context memory persistence.
 * 3. Called By: src/app/api/onboarding/lock-and-plan/route.ts.
 * 4. Calls: Supabase admin client, context-pack.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { PersonMemoryData, PersonMemoryItem } from '@/types/domain';
import { parseMemoryStore, type MemoryItem } from '@/lib/ai/context-pack';
import type { ConfirmedMemoryFact } from './validation';

export async function cleanupOrphanGoals(admin: SupabaseClient<Database>, userId: string): Promise<void> {
  const { data: existingGoals } = await admin
    .from('goals')
    .select('id, status')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE');

  for (const g of existingGoals || []) {
    const { count: mCount } = await admin.from('milestones').select('id', { count: 'exact', head: true }).eq('goal_id', g.id);
    const { count: tCount } = await admin.from('tasks').select('id', { count: 'exact', head: true }).eq('goal_id', g.id);
    if (!mCount || mCount === 0 || !tCount || tCount === 0) {
      await admin.from('goals').delete().eq('id', g.id);
    }
  }
}

export async function processConfirmedMemoryFacts(
  admin: SupabaseClient<Database>,
  userId: string,
  confirmedFacts: ConfirmedMemoryFact[],
  category: string,
  existingPersonMemory: unknown
): Promise<MemoryItem[]> {
  const nowIso = new Date().toISOString();
  const newPersonItems: PersonMemoryItem[] = [];
  const newGoalItems: MemoryItem[] = [];

  for (const f of confirmedFacts) {
    if (f.scope === 'PERSON') {
      newPersonItems.push({
        id: `ctx_${crypto.randomUUID().slice(0, 8)}`,
        scope: f.scope,
        bucket: f.bucket,
        fact: f.fact,
        source: 'user_confirmed',
        confidence: 1.0,
        pinned: false,
        locked_by_user: true,
        updated_at: nowIso,
        valid_until: null,
      });
    } else {
      newGoalItems.push({
        id: `ctx_${crypto.randomUUID().slice(0, 8)}`,
        scope: f.scope,
        bucket: f.bucket,
        fact: f.fact,
        source: 'user_confirmed',
        confidence: 1.0,
        pinned: false,
        locked_by_user: true,
        category,
        created_at: nowIso,
        updated_at: nowIso,
        valid_until: null,
      });
    }
  }

  if (newPersonItems.length > 0) {
    const existingPersonStore = parseMemoryStore(existingPersonMemory);
    const existingMapped: PersonMemoryItem[] = existingPersonStore.items.map((i) => ({
      id: i.id,
      scope: i.scope,
      bucket: i.bucket,
      fact: i.fact,
      source: i.source,
      confidence: i.confidence,
      pinned: i.pinned,
      locked_by_user: i.locked_by_user,
      updated_at: i.updated_at || nowIso,
      valid_until: i.valid_until || null,
    }));
    const updatedPersonStore: PersonMemoryData = {
      version: existingPersonStore.version || 1,
      items: [...newPersonItems, ...existingMapped],
    };
    await admin.from('users').update({
      person_memory_json: updatedPersonStore,
    }).eq('id', userId);
  }

  return newGoalItems;
}

export function buildOnboardingAnswers(
  goalId: string,
  title: string,
  why: string,
  deadline: string,
  hoursPerDay: number,
  workingDays: number[],
  baseline: string,
  constraints: string,
  rawFollowups: unknown
): Array<{ goal_id: string; stage: 'FIXED' | 'AI_FOLLOWUP'; question_index: number; question_text: string; answer_text: string }> {
  const answers: Array<{ goal_id: string; stage: 'FIXED' | 'AI_FOLLOWUP'; question_index: number; question_text: string; answer_text: string }> = [
    { goal_id: goalId, stage: 'FIXED', question_index: 1, question_text: 'Goal & Why', answer_text: `${title} — ${why}`.slice(0, 500) },
    { goal_id: goalId, stage: 'FIXED', question_index: 2, question_text: 'Deadline', answer_text: deadline.slice(0, 500) },
    { goal_id: goalId, stage: 'FIXED', question_index: 3, question_text: 'Schedule', answer_text: `${hoursPerDay}h/day on days ${workingDays.join(',')}`.slice(0, 500) },
    { goal_id: goalId, stage: 'FIXED', question_index: 4, question_text: 'Current Baseline', answer_text: baseline.slice(0, 500) },
    { goal_id: goalId, stage: 'FIXED', question_index: 5, question_text: 'Constraints', answer_text: constraints.slice(0, 500) },
  ];

  if (Array.isArray(rawFollowups)) {
    rawFollowups.forEach((f, idx) => {
      if (typeof f === 'object' && f !== null && 'question' in f && 'answer' in f) {
        answers.push({
          goal_id: goalId,
          stage: 'AI_FOLLOWUP' as const,
          question_index: idx + 1,
          question_text: String((f as { question: unknown }).question || `Question ${idx + 1}`).slice(0, 500),
          answer_text: String((f as { answer: unknown }).answer || '').slice(0, 500),
        });
      }
    });
  }
  return answers;
}
