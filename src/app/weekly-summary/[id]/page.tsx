import React, { Suspense } from 'react';
/**
 * 1. Purpose: Server route for Screen 37 Weekly summary page.
 * 2. Spec Ref: UI Design Guide Category C Screen 37 and Pipeline 5.
 * 3. Called By: Navigation from Bell notices list (Screen 78) or Today completion.
 * 4. Calls: createClient (Server), createAdminClient, and WeeklySummaryView.
 */

import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/db/server';
import { createAdminClient } from '@/lib/db/admin';
import { WeeklySummaryView } from '@/components/weekly-summary/weekly-summary-view';

interface ReviewWithGoal {
  id: string;
  goal_id: string;
  week_number: number;
  ai_summary: string;
  three_bullet_lines: string[];
  on_track: boolean;
  plan_changes: string;
  partner_share_line?: string;
  then_vs_now_line?: string;
  milestone_competency_updates_json: unknown;
  memory_confirmation_prompt_json?: {
    memory_id: string;
    fact: string;
    question_text: string;
  } | null;
  created_at: string;
  goals: {
    id: string;
    user_id: string;
    title: string;
    why: string;
    category: string;
    current_baseline_text: string;
    streak_weeks: number;
  };
}

async function WeeklySummaryContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=%2Fweekly-summary%2F${id}`);
  }

  const admin = createAdminClient();
  const { data: rawReview } = await admin
    .from('weekly_reviews')
    .select('*, goals(id, user_id, title, why, category, current_baseline_text, streak_weeks)')
    .eq('id', id)
    .single();

  if (!rawReview) notFound();
  const review = rawReview as unknown as ReviewWithGoal;

  if (review.goals?.user_id !== user.id) notFound();

  return <WeeklySummaryView review={review} />;
}

export default async function WeeklySummaryPage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page text-muted text-sm">
          Loading summary...
        </div>
      }
    >
      <WeeklySummaryContent params={props.params} />
    </Suspense>
  );
}
