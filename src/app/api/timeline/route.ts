import { NextResponse } from 'next/server';
/**
 * 1. Purpose: Fetches the X/Threads-style timeline feed and month calendar activity dots.
 * 2. Spec Ref: UI Design Guide Category F Screens 61-63, State 62a.
 * 3. Called By: /timeline page.
 * 4. Calls: timeline-service.ts getTimelineFeed and getMonthActivity.
 */

import { createClient } from '@/lib/db/server';
import { getTimelineFeed, getMonthActivity } from '@/lib/services/timeline-service';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const goalId = searchParams.get('goalId') || undefined;
  const rawProofType = searchParams.get('proofType') || undefined;
  const yearStr = searchParams.get('year');
  const monthStr = searchParams.get('month');

  const validProofTypes = ['ALL', 'PHOTO', 'LINK', 'NOTE'] as const;
  const proofType =
    rawProofType && (validProofTypes as readonly string[]).includes(rawProofType)
      ? (rawProofType as 'ALL' | 'PHOTO' | 'LINK' | 'NOTE')
      : undefined;

  try {
    const feed = await getTimelineFeed(user.id, { goalId, proofType });
    const activity = await getMonthActivity(
      user.id,
      yearStr ? parseInt(yearStr, 10) : undefined,
      monthStr ? parseInt(monthStr, 10) : undefined,
      goalId
    );

    return NextResponse.json({
      posts: feed.posts,
      goals: feed.goals,
      calendar: activity,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch timeline';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
