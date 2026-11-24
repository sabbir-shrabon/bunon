/**
 * 1. Purpose: API route handler for $0 zero-token Day Note logging and 0ms crisis check.
 * 2. Spec Ref: Database Schema v2.5 Section 5.2 Table 8 & Stitch Sheet 34/Screen 16.
 * 3. Called By: Day note sheet (Sheet 34) on Today and Timeline.
 * 4. Calls: createClient and day-note-service logDayNote.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/db/server';
import { guardApiRoute } from '@/lib/services/access-guard.service';
import { logDayNote, getTodayDayNote } from '@/lib/services/day-note-service';

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

  if (!goalId) {
    return NextResponse.json({ error: 'goalId required' }, { status: 400 });
  }

  const note = await getTodayDayNote(user.id, goalId);
  return NextResponse.json({ dayNote: note });
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

  const body = (await request.json()) as { goalId: string; text: string };

  if (!body.goalId || !body.text) {
    return NextResponse.json({ error: 'goalId and text are required' }, { status: 400 });
  }

  const result = await logDayNote(user.id, body.goalId, body.text);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
