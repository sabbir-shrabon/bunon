/**
 * 1. Purpose: Server component rendering Today Screen 22 (Task-First 2-Beat Thread) or GuestEntry in Suspense.
 * 2. Spec Ref: Stitch Screen 22, State 22a, and Rule 11 Frictionless Auth contract.
 * 3. Called By: Next.js App Router for '/today'.
 * 4. Calls: createClient, getTodayPlan, and TodayView.
 */

import { Suspense } from 'react';
import { connection } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/db/server';
import { getTodayPlan, type TodayPlanResponse } from '@/lib/services/today-service';
import { TodayView } from '@/components/today/today-view';

interface TodayPageProps {
  searchParams: Promise<{ goalId?: string; completed?: string }>;
}

const emptyGuestPlan: TodayPlanResponse = {
  hasActiveGoal: false,
  isPaused: false,
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
};

async function TodayPageContent({ searchParams }: TodayPageProps) {
  await connection();

  // Fast zero-latency path for guests without Supabase auth cookies
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.getAll().some((c) => c.name.startsWith('sb-'));

  if (!hasAuthCookie) {
    return <TodayView initialData={emptyGuestPlan} />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <TodayView initialData={emptyGuestPlan} />;
  }

  const { goalId } = await searchParams;
  const planData = await getTodayPlan(user.id, goalId);

  return <TodayView initialData={planData} />;
}

export default function TodayPage(props: TodayPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--page)] text-muted text-sm">
          Loading Today…
        </div>
      }
    >
      <TodayPageContent {...props} />
    </Suspense>
  );
}
