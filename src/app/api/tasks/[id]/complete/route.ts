/**
 * 1. Purpose: API route handler for atomically completing a task with evidence and updating storage bytes.
 * 2. Spec Ref: Database Schema Section 4 & Category D Screens 39-49 (State 45).
 * 3. Called By: Create proof screen (/proof/create).
 * 4. Calls: createClient and evidence-service completeTaskWithEvidence.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/db/server';
import { completeTaskWithEvidence, type CompleteTaskPayload } from '@/lib/services/evidence-service';

export async function POST(
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

  const { id: taskId } = await params;
  const body = (await request.json()) as CompleteTaskPayload;

  const resolvedType = body.type || (body as { proofType?: CompleteTaskPayload['type'] }).proofType;
  if (!resolvedType) {
    return NextResponse.json({ error: 'Proof type required' }, { status: 400 });
  }

  if (resolvedType === 'PHOTO' || resolvedType === 'VIDEO' || resolvedType === 'FILE') {
    if (!body.storagePath || typeof body.storagePath !== 'string' || body.storagePath.startsWith('blob:')) {
      return NextResponse.json(
        { error: 'PHOTO_STORAGE_PATH_REQUIRED', message: 'Valid storage path is required for uploaded proof' },
        { status: 400 }
      );
    }
  }

  const result = await completeTaskWithEvidence(user.id, taskId, {
    ...body,
    type: resolvedType,
  });

  if (!result.success) {
    console.error('[tasks/complete error]', { taskId, error: result.error });
    const status =
      result.error === 'MAINTENANCE_MODE'
        ? 503
        : result.error === 'ACCOUNT_SUSPENDED' || result.error === 'PRO_REQUIRED' || result.error === 'USER_INACTIVE'
          ? 403
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  // Invalidate Next.js server cache across the 3 main views immediately
  revalidatePath('/today');
  revalidatePath('/roadmap');
  revalidatePath('/timeline');

  return NextResponse.json({
    ok: true,
    taskId: result.taskId,
    weekCompleted: result.weekCompleted,
    nextTaskId: result.nextTaskId,
    evidence: result.evidence,
  });
}
