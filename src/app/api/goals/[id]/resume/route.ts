import { NextResponse } from 'next/server';
/**
 * 1. Purpose: Resumes a paused goal early, resetting paused flags to active.
 * 2. Spec Ref: UI Design Guide Category E Sheet 54 (Resume a goal) and State 27.
 * 3. Called By: Roadmap GoalMenu ResumeGoalSheet and Today PausedState.
 * 4. Calls: roadmap-service.ts resumeGoal.
 */

import { createClient } from '@/lib/db/server';
import { resumeGoal } from '@/lib/services/roadmap-service';

export async function POST(
  _request: Request,
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
    const result = await resumeGoal(user.id, goalId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to resume goal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
