import 'server-only';
/**
 * 1. Purpose: Deterministically selects up to 15 prioritized memory context items for AI prompts.
 * 2. Spec Ref: Database Schema v2.5 Section 5.2 Table 1 & Prompt Catalog Section 1 Rule 6.
 * 3. Called By: AI Service Layer assembler and prompt runners.
 * 4. Calls: src/types/domain.ts.
 */

import type { MemoryItem } from '@/types/domain';

export type { MemoryItem };

export interface MemoryStore {
  version: number;
  items: MemoryItem[];
}

export function parseMemoryStore(data: unknown): MemoryStore {
  if (
    typeof data === 'object' &&
    data !== null &&
    'items' in data &&
    Array.isArray((data as MemoryStore).items)
  ) {
    return data as MemoryStore;
  }
  return { version: 1, items: [] };
}

export function buildContextPack(
  personMemoryJson: unknown,
  journeyMemoryJson: unknown,
  goalCategory?: string | null,
  limit = 15
): MemoryItem[] {
  const personItems = parseMemoryStore(personMemoryJson).items;
  const goalItems = parseMemoryStore(journeyMemoryJson).items;

  const nowIso = new Date().toISOString().slice(0, 10);

  // Filter out expired items and unconfirmed AI inferences
  const isEligible = (item: MemoryItem) => {
    if (item.valid_until && item.valid_until < nowIso) return false;
    if (item.source === 'ai_inferred') return false; // Inferred items excluded from planning
    return true;
  };

  const validPerson = personItems.filter(isEligible);
  const validGoal = goalItems.filter(isEligible);

  // Priority 1: pinned items from GOAL and PERSON
  const pinnedGoal = validGoal.filter((i) => i.pinned);
  const pinnedPerson = validPerson.filter((i) => i.pinned);

  // Priority 2: locked_by_user && user_confirmed matching category
  const lockedGoal = validGoal.filter(
    (i) => !i.pinned && i.locked_by_user && i.source === 'user_confirmed'
  );
  const lockedPerson = validPerson.filter(
    (i) =>
      !i.pinned &&
      i.locked_by_user &&
      i.source === 'user_confirmed' &&
      (!i.category || !goalCategory || i.category === goalCategory)
  );

  // Priority 3: recent day_note items
  const dayNoteGoal = validGoal.filter(
    (i) => !i.pinned && !i.locked_by_user && i.source === 'day_note'
  );
  const dayNotePerson = validPerson.filter(
    (i) => !i.pinned && !i.locked_by_user && i.source === 'day_note'
  );

  // Priority 4: remaining confirmed facts
  const restGoal = validGoal.filter(
    (i) => !i.pinned && !i.locked_by_user && i.source !== 'day_note'
  );
  const restPerson = validPerson.filter(
    (i) => !i.pinned && !i.locked_by_user && i.source !== 'day_note'
  );

  const combined: MemoryItem[] = [];
  const seenFacts = new Set<string>();

  // Helper to add items, giving GOAL items precedence over PERSON items for identical facts
  const addItems = (items: MemoryItem[]) => {
    for (const item of items) {
      const normalized = item.fact.trim().toLowerCase();
      if (!seenFacts.has(normalized)) {
        seenFacts.add(normalized);
        combined.push(item);
        if (combined.length >= limit) return true;
      }
    }
    return false;
  };

  if (addItems(pinnedGoal)) return combined;
  if (addItems(pinnedPerson)) return combined;
  if (addItems(lockedGoal)) return combined;
  if (addItems(lockedPerson)) return combined;
  if (addItems(dayNoteGoal)) return combined;
  if (addItems(dayNotePerson)) return combined;
  if (addItems(restGoal)) return combined;
  addItems(restPerson);

  return combined.slice(0, limit);
}
