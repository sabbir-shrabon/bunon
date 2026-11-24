/**
 * 1. Purpose: Step 1 of 2 week completion endpoint running idempotent Pipeline 5 Weekly Review.
 * 2. Spec Ref: UI Design Guide Category C Screen 37 and Pipeline 5.
 * 3. Called By: TodayView two-step week advancement flow.
 * 4. Calls: authorizeWeekMutation, reviewWeek, handleWeekRouteError.
 */

import { NextResponse } from 'next/server';
import { reviewWeek } from '@/lib/services/week-service';
import { authorizeWeekMutation, handleWeekRouteError } from '../route-helpers';

export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await authorizeWeekMutation(request);
  if (!auth.ok) return auth.response;

  try {
    const result = await reviewWeek(auth.userId, auth.goalId);
    return NextResponse.json(result);
  } catch (err) {
    return handleWeekRouteError(
      err,
      'We could not review this week just now. Your progress is safe — please tap to try again.'
    );
  }
}
