/**
 * 1. Purpose: Step 2 of 2 week completion endpoint running idempotent Pipeline 3 (or Pipeline 7) rollover.
 * 2. Spec Ref: UI Design Guide Category C Screen 37, Category H, and Pipelines 3 & 7.
 * 3. Called By: TodayView two-step week advancement flow.
 * 4. Calls: authorizeWeekMutation, planNextWeek, revalidatePath, handleWeekRouteError.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { planNextWeek } from '@/lib/services/week-rollover-service';
import { authorizeWeekMutation, handleWeekRouteError } from '../route-helpers';

export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await authorizeWeekMutation(request);
  if (!auth.ok) return auth.response;

  try {
    const result = await planNextWeek(auth.userId, auth.goalId);
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
