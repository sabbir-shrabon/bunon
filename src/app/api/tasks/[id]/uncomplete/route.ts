import { NextResponse, type NextRequest } from 'next/server';
/**
 * 1. Purpose: API route handler for undoing a completed task (deleting proof and resetting to pending).
 * 2. Spec Ref: Stitch Screen 22, Milestone 4 Task Loop, and Undo Completed Task Contract.
 * 3. Called By: Today view UndoCompleteSheet component.
 * 4. Calls: createClient, task-service undoTaskCompletion, and next/cache revalidatePath.
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/db/server';
import { guardApiRoute } from '@/lib/services/access-guard.service';
import { undoTaskCompletion } from '@/lib/services/task-service';

export async function POST(
  _request: NextRequest,
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
  const result = await undoTaskCompletion(user.id, taskId);

  if (!result.success) {
    console.error('[tasks/uncomplete error]', { taskId, error: result.error });
    return NextResponse.json({ error: result.error || 'Failed to uncomplete task' }, { status: 400 });
  }

  // Invalidate caches across the 3 main views immediately
  revalidatePath('/today');
  revalidatePath('/roadmap');
  revalidatePath('/timeline');

  return NextResponse.json({ success: true, taskId });
}
