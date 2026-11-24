/**
 * 1. Purpose: API route handler for reading and mutating What Bunon Knows memory and time maps.
 * 2. Spec Ref: Dedicated Page 50a & Competition Addendum pure service contract.
 * 3. Called By: /what-bunon-knows frontend page and external clients.
 * 4. Calls: Server Supabase client and context-service.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/db/server';
import { guardApiRoute } from '@/lib/services/access-guard.service';
import type { DayTimeMap } from '@/types/domain';
import {
  getWhatBunonKnows,
  addMemoryItem,
  updateMemoryItem,
  deleteMemoryItem,
  updateDayTimeMap,
} from '@/lib/services/context-service';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const goalId = searchParams.get('goalId');

  const data = await getWhatBunonKnows(user.id, goalId);
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const guard = await guardApiRoute(user.id);
  if (!guard.ok) return guard.response;

  const body = (await request.json()) as {
    scope: 'PERSON' | 'DOMAIN' | 'GOAL';
    bucket?: 'knowledge_and_skill_gaps' | 'life_rhythm_and_constraints' | 'what_works_for_this_user' | 'mastered_foundations' | 'past_pivots_and_decisions';
    fact: string;
    category?: string | null;
    goalId?: string | null;
  };

  if (!body.fact || !body.fact.trim()) {
    return NextResponse.json({ error: 'Fact is required' }, { status: 400 });
  }

  const item = await addMemoryItem(user.id, body);
  return NextResponse.json({ item });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const guard = await guardApiRoute(user.id);
  if (!guard.ok) return guard.response;

  const body = (await request.json()) as {
    itemId?: string;
    goalId?: string | null;
    updates?: { fact?: string; pinned?: boolean };
    dayTimeMap?: DayTimeMap;
  };

  if (body.dayTimeMap) {
    await updateDayTimeMap(user.id, body.dayTimeMap);
    return NextResponse.json({ ok: true });
  }

  if (!body.itemId || !body.updates) {
    return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
  }

  await updateMemoryItem(user.id, body.itemId, body.updates, body.goalId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const guard = await guardApiRoute(user.id);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('itemId');
  const goalId = searchParams.get('goalId');

  if (!itemId) {
    return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
  }

  await deleteMemoryItem(user.id, itemId, goalId);
  return NextResponse.json({ ok: true });
}
