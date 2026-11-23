import { NextResponse } from 'next/server';
/**
 * 1. Purpose: Pauses an active goal for up to 14 days, shifting the deadline date accordingly.
 * 2. Spec Ref: UI Design Guide Category E Sheet 53 (Pause a goal) and State 27.
 * 3. Called By: Roadmap GoalMenu PauseGoalSheet.
 * 4. Calls: roadmap-service.ts pauseGoal.
 */

import { createClient } from '@/lib/db/server';
import { pauseGoal } from '@/lib/services/roadmap-service';

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
    const days = Number(body.days) || 7;
    const reason = body.reason as string | undefined;

    const result = await pauseGoal(user.id, goalId, days, reason);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to pause goal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
