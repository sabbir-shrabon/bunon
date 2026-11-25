import 'server-only';
/**
 * 1. Purpose: Pure helper that persists AI-proposed memory operations while respecting locked user facts and 30-item caps.
 * 2. Spec Ref: Prompt Catalog v2.5 Section 7 (Pipelines 3, 4, 5) & Database Schema Section 5.2.
 * 3. Called By: Pipeline 3, 4, and 5 server routes/services.
 * 4. Calls: Admin Supabase client and context-pack parser.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { MemoryOp } from '@/types/ai-schemas-common';
import type { MemoryItem, PersonMemoryData, PersonMemoryItem } from '@/types/domain';
import { parseMemoryStore } from './context-pack';

const MAX_STORE_ITEMS = 30;

export interface ApplyMemoryOpsParams {
  supabaseAdmin: SupabaseClient<Database>;
  userId: string;
  goalId?: string | null;
  ops?: MemoryOp[] | null;
}

export interface ApplyMemoryOpsResult {
  appliedCount: number;
  skippedLockedCount: number;
}

function capMemoryItems(items: MemoryItem[], limit = MAX_STORE_ITEMS): MemoryItem[] {
  if (items.length <= limit) return items;
  const protectedItems = items
    .filter((i) => i.pinned || i.locked_by_user)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  if (protectedItems.length >= limit) return protectedItems.slice(0, limit);

  const unlockedItems = items
    .filter((i) => !i.pinned && !i.locked_by_user)
    .sort((a, b) => (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || ''));
  return [...protectedItems, ...unlockedItems.slice(0, limit - protectedItems.length)];
}

function applyOpsToItems(existingItems: MemoryItem[], ops: MemoryOp[], nowIso: string) {
  const items = existingItems.map((item) => ({ ...item }));
  let changed = false;
  let appliedCount = 0;
  let skippedLockedCount = 0;

  for (const op of ops) {
    const trimmedFact = op.fact.trim();
    if (!trimmedFact) continue;

    const normFact = trimmedFact.toLowerCase();
    const matchIdx = items.findIndex(
      (item) =>
        item.fact.trim().toLowerCase() === normFact ||
        (item.bucket === op.bucket && item.fact === op.fact)
    );

    if (matchIdx !== -1 && items[matchIdx].locked_by_user === true) {
      skippedLockedCount += 1;
      continue;
    }

    if (op.op === 'UPSERT') {
      const nextFields = {
        scope: op.scope,
        bucket: op.bucket,
        fact: trimmedFact,
        source: op.source,
        confidence: op.confidence,
        locked_by_user: false,
        updated_at: nowIso,
        valid_until: op.valid_until ?? null,
      };
      if (matchIdx !== -1) {
        items[matchIdx] = { ...items[matchIdx], ...nextFields };
      } else {
        items.push({ id: `ctx_${crypto.randomUUID().slice(0, 8)}`, ...nextFields, pinned: false, created_at: nowIso });
      }
      changed = true;
      appliedCount += 1;
    } else if (matchIdx !== -1) {
      items.splice(matchIdx, 1);
      changed = true;
      appliedCount += 1;
    }
  }

  return { items: changed ? capMemoryItems(items) : items, changed, appliedCount, skippedLockedCount };
}

function toPersonMemoryData(version: number, items: MemoryItem[], nowIso: string): PersonMemoryData {
  const mapped: PersonMemoryItem[] = items.map((i) => ({
    id: i.id,
    scope: i.scope,
    bucket: i.bucket,
    fact: i.fact,
    source: i.source,
    confidence: i.confidence,
    pinned: i.pinned,
    locked_by_user: i.locked_by_user,
    updated_at: i.updated_at || nowIso,
    valid_until: i.valid_until ?? null,
  }));
  return { version, items: mapped };
}

export async function applyProposedMemoryOps(params: ApplyMemoryOpsParams): Promise<ApplyMemoryOpsResult> {
  const { supabaseAdmin, userId, goalId, ops } = params;
  if (!ops || ops.length === 0) return { appliedCount: 0, skippedLockedCount: 0 };

  const personOps = ops.filter((o) => o.scope === 'PERSON' || o.scope === 'DOMAIN');
  const goalOps = goalId ? ops.filter((o) => o.scope === 'GOAL') : [];
  const nowIso = new Date().toISOString();
  let appliedCount = 0;
  let skippedLockedCount = 0;

  try {
    if (personOps.length > 0) {
      const { data: userRow, error: userErr } = await supabaseAdmin
        .from('users')
        .select('person_memory_json, person_memory_version')
        .eq('id', userId)
        .single();
      if (userErr || !userRow) {
        console.warn('[Bunon MemoryOps] Failed to read user memory:', userErr?.message || 'not found');
      } else {
        const store = parseMemoryStore(userRow.person_memory_json);
        const res = applyOpsToItems(store.items, personOps, nowIso);
        appliedCount += res.appliedCount;
        skippedLockedCount += res.skippedLockedCount;
        if (res.changed) {
          const nextVersion = (userRow.person_memory_version || store.version || 1) + 1;
          const { error } = await supabaseAdmin
            .from('users')
            .update({ person_memory_json: toPersonMemoryData(nextVersion, res.items, nowIso), person_memory_version: nextVersion })
            .eq('id', userId);
          if (error) console.warn('[Bunon MemoryOps] Failed to update user memory:', error.message);
        }
      }
    }

    if (goalOps.length > 0 && goalId) {
      const { data: goalRow, error: goalErr } = await supabaseAdmin
        .from('goals')
        .select('journey_memory_json, memory_version')
        .eq('id', goalId)
        .eq('user_id', userId)
        .single();
      if (goalErr || !goalRow) {
        console.warn('[Bunon MemoryOps] Failed to read goal memory:', goalErr?.message || 'not found');
      } else {
        const store = parseMemoryStore(goalRow.journey_memory_json);
        const res = applyOpsToItems(store.items, goalOps, nowIso);
        appliedCount += res.appliedCount;
        skippedLockedCount += res.skippedLockedCount;
        if (res.changed) {
          const nextVersion = (goalRow.memory_version || store.version || 1) + 1;
          const baseJson =
            typeof goalRow.journey_memory_json === 'object' && goalRow.journey_memory_json !== null
              ? goalRow.journey_memory_json
              : {};
          const { error } = await supabaseAdmin
            .from('goals')
            .update({ journey_memory_json: { ...baseJson, version: nextVersion, items: res.items }, memory_version: nextVersion })
            .eq('id', goalId)
            .eq('user_id', userId);
          if (error) console.warn('[Bunon MemoryOps] Failed to update goal memory:', error.message);
        }
      }
    }
  } catch (err) {
    console.warn('[Bunon MemoryOps] Unexpected error:', err instanceof Error ? err.message : String(err));
  }

  return { appliedCount, skippedLockedCount };
}
