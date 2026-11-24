/**
 * 1. Purpose: API route handler for restoring a task from original_task_json in 0ms / $0 tokens.
 * 2. Spec Ref: Database Schema Section 5.2 Table 6 & Stitch Screen 22 'Adjusted: [reason] · Undo'.
 * 3. Called By: Today view UndoChip component.
 * 4. Calls: createClient and task-service undoTaskAdjustment.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';
import { guardApiRoute } from '@/lib/services/access-guard.service';
import { undoTaskAdjustment } from '@/lib/services/task-service';

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
  const result = await undoTaskAdjustment(user.id, taskId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
