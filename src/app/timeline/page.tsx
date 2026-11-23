import React, { Suspense } from 'react';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/db/server';
import { getTimelineFeed, getMonthActivity } from '@/lib/services/timeline-service';
import { TimelineView } from '@/components/timeline/timeline-view';

async function TimelineContent({
  searchParams,
}: {
  searchParams: Promise<{ goalId?: string; proofType?: string }>;
}) {
  await connection();
  const { goalId, proofType } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=%2Ftimeline');
  }

  const validProofTypes = ['ALL', 'PHOTO', 'LINK', 'NOTE'] as const;
  const cleanProofType =
    proofType && (validProofTypes as readonly string[]).includes(proofType)
      ? (proofType as 'ALL' | 'PHOTO' | 'LINK' | 'NOTE')
      : undefined;

  const feed = await getTimelineFeed(user.id, { goalId, proofType: cleanProofType });
  const calendar = await getMonthActivity(user.id, undefined, undefined, goalId);

  return (
    <TimelineView
      initialPosts={feed.posts}
      goals={feed.goals}
      calendar={calendar}
    />
  );
}

export default async function TimelinePage(props: {
  searchParams: Promise<{ goalId?: string; proofType?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page text-muted text-sm">
          Loading timeline...
        </div>
      }
    >
      <TimelineContent searchParams={props.searchParams} />
    </Suspense>
  );
}
