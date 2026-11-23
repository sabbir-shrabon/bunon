import { NextResponse } from 'next/server';
/**
 * 1. Purpose: Netlify-style Danger Zone delete requiring exact goal name typing before permanent purge.
 * 2. Spec Ref: UI Design Guide Category G Screen 86 & Sheet 87.
 * 3. Called By: DangerZoneDeleteSheet 87.
 * 4. Calls: roadmap-service.ts deleteGoal.
 */

import { createClient } from '@/lib/db/server';
import { deleteGoal } from '@/lib/services/roadmap-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: goalId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const confirmName = (body.confirmName as string) || '';

    const result = await deleteGoal(user.id, goalId, confirmName);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
