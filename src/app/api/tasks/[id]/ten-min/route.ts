/**
 * 1. Purpose: API route handler for toggling the 10-minute version / fast zero-prep swap on a task.
 * 2. Spec Ref: Stitch State 33 & Sheet 37b.
 * 3. Called By: Stuck Sheet 37b and Today task 10-min active toggle.
 * 4. Calls: createClient and task-service toggle10MinuteVersion.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/db/server';
import { toggle10MinuteVersion } from '@/lib/services/task-service';

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
  const body = (await request.json()) as { active: boolean };

  if (typeof body.active !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const result = await toggle10MinuteVersion(user.id, taskId, body.active);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
