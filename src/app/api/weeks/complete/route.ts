import { NextResponse } from 'next/server';
/**
 * 1. Purpose: Completes a goal week, executing Pipeline 5 review, Pipeline 3 rollover, or Pipeline 7 completion.
 * 2. Spec Ref: UI Design Guide Category C Screen 37, Category H Screen 97, and Pipelines 5, 3, 7.
 * 3. Called By: Today AllDoneView and WeeklySummary triggers.
 * 4. Calls: week-service.ts advanceWeek.
 */

import { createClient } from '@/lib/db/server';
import { advanceWeek } from '@/lib/services/week-service';

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const goalId = body.goalId;

    if (!goalId) {
      return NextResponse.json({ error: 'goalId is required' }, { status: 400 });
    }

    const result = await advanceWeek(user.id, goalId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to advance week';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
