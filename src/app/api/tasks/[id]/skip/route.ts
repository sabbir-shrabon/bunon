/**
 * 1. Purpose: API route handler for marking a task as SKIPPED_BASIC with zero proof required.
 * 2. Spec Ref: Database Schema v2.5 Section 5.2 Table 6 & Stitch Sheet 37b / Screen 22.
 * 3. Called By: Stuck Sheet 37b and Today task top meta row.
 * 4. Calls: createClient and task-service skipTaskAsBasic.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';
import { guardApiRoute } from '@/lib/services/access-guard.service';
import { skipTaskAsBasic } from '@/lib/services/task-service';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const guard = await guardApiRoute(user.id);
  if (!guard.ok) return guard.response;

  const { id: taskId } = await params;
  const result = await skipTaskAsBasic(user.id, taskId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
