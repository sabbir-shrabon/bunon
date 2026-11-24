/**
 * 1. Purpose: Legacy single-call week completion endpoint delegating cleanly to idempotent review + plan-next.
 * 2. Spec Ref: UI Design Guide Category C Screen 37, Category H Screen 97, and Pipelines 5, 3, 7.
 * 3. Called By: Backward-compatible callers; Today UI uses /api/weeks/review + /api/weeks/plan-next.
 * 4. Calls: authorizeWeekMutation, advanceWeek, revalidatePath, handleWeekRouteError.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { advanceWeek } from '@/lib/services/week-service';
import { authorizeWeekMutation, handleWeekRouteError } from '../route-helpers';

export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await authorizeWeekMutation(request);
  if (!auth.ok) return auth.response;

  try {
    const result = await advanceWeek(auth.userId, auth.goalId);
    revalidatePath('/today');
    revalidatePath('/roadmap');
    revalidatePath('/timeline');
    return NextResponse.json(result);
  } catch (err) {
    return handleWeekRouteError(
      err,
      "We could not build next week's plan just now. Your progress is safe — please tap to try again."
    );
  }
}
