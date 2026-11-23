/**
 * 1. Purpose: Next.js API route handler for fetching Today's plan, hero task, and banner state.
 * 2. Spec Ref: Stitch Screen 22, State 22a, and Competition Addendum pure service contract.
 * 3. Called By: Frontend Today view (/today).
 * 4. Calls: createClient and today-service getTodayPlan.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/db/server';
import { getTodayPlan } from '@/lib/services/today-service';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      hasActiveGoal: false,
      isGuest: true,
      goals: [],
      activeGoal: null,
      currentMilestone: null,
      heroTask: null,
      heroTaskSteps: [],
      adaptiveSlice: null,
      remainingWeekTasks: [],
      threadTasks: [],
      activeTaskIndex: 0,
      isWeekDone: false,
      persona: null,
      banner: null,
      todayDayNote: null,
      streakText: null,
    });
  }

  const { searchParams } = new URL(request.url);
  const goalId = searchParams.get('goalId');

  const data = await getTodayPlan(user.id, goalId);
  return NextResponse.json(data);
}
