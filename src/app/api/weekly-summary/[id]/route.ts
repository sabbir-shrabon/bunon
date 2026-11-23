import { NextResponse } from 'next/server';
/**
 * 1. Purpose: Fetches weekly review summary, Then vs. Now, and photocard text lines for Screen 37.
 * 2. Spec Ref: UI Design Guide Category C Screen 37 and Bell notices list (Screen 78).
 * 3. Called By: /weekly-summary/[id] page.
 * 4. Calls: Admin Supabase client.
 */

import { createClient } from '@/lib/db/server';
import { createAdminClient } from '@/lib/db/admin';

interface ReviewWithGoal {
  id: string;
  goal_id: string;
  week_number: number;
  ai_summary: string;
  three_bullet_lines: string[];
  on_track: boolean;
  plan_changes: string;
  partner_share_line: string;
  milestone_competency_updates_json: unknown;
  memory_confirmation_prompt_json: string | null;
  created_at: string;
  goals?: {
    id: string;
    user_id: string;
    title: string;
    why: string;
    category: string;
    current_baseline_text: string | null;
    streak_weeks: number;
  } | null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: rawReview, error: reviewErr } = await admin
    .from('weekly_reviews')
    .select('*, goals(id, user_id, title, why, category, current_baseline_text, streak_weeks)')
    .eq('id', id)
    .single();

  if (reviewErr || !rawReview) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  const review = rawReview as unknown as ReviewWithGoal;

  if (review.goals?.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ review });
}
