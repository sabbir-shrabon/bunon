import 'server-only';
/**
 * 1. Purpose: Pure domain service for reading and mutating What Bunon Knows memory and time maps.
 * 2. Spec Ref: Database Schema v2.5 Section 5.2 Table 1 & Competition Addendum Rule 9.
 * 3. Called By: /api/what-bunon-knows route and future MCP server tools.
 * 4. Calls: Admin Supabase client and context-pack.
 */

import { createAdminClient } from '@/lib/db/admin';
import {
  parseMemoryStore,
  type MemoryItem,
  type MemoryStore,
} from '@/lib/ai/context-pack';
import type { DayTimeMap, PersonMemoryData } from '@/types/domain';

export interface WhatBunonKnowsResponse {
  aboutMe: MemoryStore;
  dayTimeMap: DayTimeMap;
  goals: Array<{
    id: string;
    title: string;
    category: string;
    journeyMemory: MemoryStore;
    missingContextBoosters?: string[];
  }>;
  selectedGoalId: string | null;
}

export async function getWhatBunonKnows(
  userId: string,
  goalId?: string | null
): Promise<WhatBunonKnowsResponse> {
  const admin = createAdminClient();

  const { data: user } = await admin
    .from('users')
    .select('person_memory_json, day_time_map_json')
    .eq('id', userId)
    .single();

  const { data: goals } = await admin
    .from('goals')
    .select('id, title, category, journey_memory_json')
    .eq('user_id', userId)
    .in('status', ['ACTIVE', 'DRAFT', 'PAUSED'])
    .order('created_at', { ascending: false });

  const aboutMe = parseMemoryStore(user?.person_memory_json);
  const dayTimeMap = (user?.day_time_map_json as DayTimeMap) || {
    sat: { available_minutes: 90 },
    sun: { available_minutes: 60 },
    mon: { available_minutes: 30 },
    tue: { available_minutes: 60 },
    wed: { available_minutes: 60 },
    thu: { available_minutes: 60 },
    fri: { available_minutes: 90 },
  };

  const goalList = (goals || []).map((g) => {
    const memory = parseMemoryStore(g.journey_memory_json);
    const raw = g.journey_memory_json as Record<string, unknown> | null;
    const boosters = Array.isArray(raw?.missing_context_boosters)
      ? (raw.missing_context_boosters as string[])
      : [];
    return {
      id: g.id,
      title: g.title,
      category: g.category,
      journeyMemory: memory,
      missingContextBoosters: boosters,
    };
  });

  const selectedGoalId =
    goalId && goalList.some((g) => g.id === goalId)
      ? goalId
      : goalList[0]?.id || null;

  return {
    aboutMe,
    dayTimeMap,
    goals: goalList,
    selectedGoalId,
  };
}

export async function addMemoryItem(
  userId: string,
  params: {
    scope: 'PERSON' | 'DOMAIN' | 'GOAL';
    bucket?: MemoryItem['bucket'];
    fact: string;
    category?: string | null;
    goalId?: string | null;
  }
): Promise<MemoryItem> {
  const admin = createAdminClient();
  const newItem: MemoryItem = {
    id: `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    scope: params.scope,
    bucket: params.bucket || 'life_rhythm_and_constraints',
    fact: params.fact.trim().slice(0, 200),
    source: 'user_confirmed',
    confidence: 1.0,
    pinned: false,
    locked_by_user: true,
    category: params.category ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (params.scope === 'GOAL' && params.goalId) {
    const { data: goal } = await admin
      .from('goals')
      .select('journey_memory_json')
      .eq('id', params.goalId)
      .eq('user_id', userId)
      .single();

    const store = parseMemoryStore(goal?.journey_memory_json);
    store.items.unshift(newItem);

    await admin
      .from('goals')
      .update({ journey_memory_json: store as unknown as Record<string, unknown> })
      .eq('id', params.goalId);
  } else {
    const { data: user } = await admin
      .from('users')
      .select('person_memory_json')
      .eq('id', userId)
      .single();

    const store = parseMemoryStore(user?.person_memory_json);
    store.items.unshift(newItem);

    await admin
      .from('users')
      .update({ person_memory_json: store as unknown as PersonMemoryData })
      .eq('id', userId);
  }

  return newItem;
}

export async function updateMemoryItem(
  userId: string,
  itemId: string,
  updates: Partial<Pick<MemoryItem, 'fact' | 'pinned'>>,
  goalId?: string | null
): Promise<void> {
  const admin = createAdminClient();

  if (goalId) {
    const { data: goal } = await admin
      .from('goals')
      .select('journey_memory_json')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    const store = parseMemoryStore(goal?.journey_memory_json);
    const index = store.items.findIndex((i) => i.id === itemId);
    if (index !== -1) {
      store.items[index] = {
        ...store.items[index],
        ...updates,
        locked_by_user: true,
        updated_at: new Date().toISOString(),
      };
      await admin
        .from('goals')
        .update({ journey_memory_json: store as unknown as Record<string, unknown> })
        .eq('id', goalId);
    }
  } else {
    const { data: user } = await admin
      .from('users')
      .select('person_memory_json')
      .eq('id', userId)
      .single();

    const store = parseMemoryStore(user?.person_memory_json);
    const index = store.items.findIndex((i) => i.id === itemId);
    if (index !== -1) {
      store.items[index] = {
        ...store.items[index],
        ...updates,
        locked_by_user: true,
        updated_at: new Date().toISOString(),
      };
      await admin
        .from('users')
        .update({ person_memory_json: store as unknown as PersonMemoryData })
        .eq('id', userId);
    }
  }
}

export async function deleteMemoryItem(
  userId: string,
  itemId: string,
  goalId?: string | null
): Promise<void> {
  const admin = createAdminClient();

  if (goalId) {
    const { data: goal } = await admin
      .from('goals')
      .select('journey_memory_json')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    const store = parseMemoryStore(goal?.journey_memory_json);
    store.items = store.items.filter((i) => i.id !== itemId);
    await admin
      .from('goals')
      .update({ journey_memory_json: store as unknown as Record<string, unknown> })
      .eq('id', goalId);
  } else {
    const { data: user } = await admin
      .from('users')
      .select('person_memory_json')
      .eq('id', userId)
      .single();

    const store = parseMemoryStore(user?.person_memory_json);
    store.items = store.items.filter((i) => i.id !== itemId);
    await admin
      .from('users')
      .update({ person_memory_json: store as unknown as PersonMemoryData })
      .eq('id', userId);
  }
}

export async function updateDayTimeMap(
  userId: string,
  dayTimeMap: DayTimeMap
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from('users')
    .update({ day_time_map_json: dayTimeMap })
    .eq('id', userId);
}
