/**
 * 1. Purpose: API route handler for ticking sub-steps 1..N-1 without proof.
 * 2. Spec Ref: Database Schema v2.5 Section 5.2 Table 6 & Stitch Screen 22 Beat 1.
 * 3. Called By: Today view SubStep component.
 * 4. Calls: createClient and task-service tickSubstep.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/db/server';
import { guardApiRoute } from '@/lib/services/access-guard.service';
import { tickSubstep } from '@/lib/services/task-service';

export async function PATCH(
  request: NextRequest,
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
  const body = (await request.json()) as { stepNumber: number; done: boolean };

  if (typeof body.stepNumber !== 'number' || typeof body.done !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const result = await tickSubstep(user.id, taskId, body.stepNumber, body.done);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
