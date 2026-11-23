import React, { Suspense } from 'react';
/**
 * 1. Purpose: Public read-only page for Screen 102/103 /journey/:slug with OpenGraph metadata and cheers.
 * 2. Spec Ref: UI Design Guide Category H Screens 102 & 103.
 * 3. Called By: Visiting /journey/:slug or social media link share.
 * 4. Calls: createAdminClient, createClient (Server), and JourneyCardView.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/db/server';
import { getPublicJourneyCard, getJourneyCard } from '@/lib/services/journey-service';
import { JourneyCardView } from '@/components/journey/journey-card-view';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const card = await getPublicJourneyCard(slug);
  if (!card) {
    return { title: 'Journey Card · Bunon' };
  }

  const title = `${card.userName} completed ${card.goals?.title} · Bunon Journey Card`;
  const description = card.day1_vs_now_story || card.journey_card_headline;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/journey/${slug}`,
    },
  };
}

async function JourneyContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let card = await getPublicJourneyCard(slug);
  let isOwner = false;

  if (!card && user) {
    // Check if user is owner of a private card
    const { data: userCard } = await supabase
      .from('journey_cards')
      .select('goal_id')
      .eq('public_slug', slug)
      .eq('user_id', user.id)
      .maybeSingle();

    if (userCard?.goal_id) {
      card = await getJourneyCard(user.id, userCard.goal_id);
      isOwner = true;
    }
  }

  if (!card) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center bg-page">
        <div className="max-w-[340px] p-6 rounded-[20px] bg-card border border-hairline">
          <h1 className="text-[18px] font-bold text-ink">This page is no longer available</h1>
          <p className="text-[13px] text-muted mt-2">
            This Journey Card may be set to private or was removed by the owner.
          </p>
        </div>
      </div>
    );
  }

  if (card.status === 'REVOKED') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center bg-page">
        <div className="max-w-[340px] p-6 rounded-[20px] bg-card border border-hairline">
          <h1 className="text-[18px] font-bold text-ink">This page is no longer available</h1>
          <p className="text-[13px] text-muted mt-2">
            This page has been taken offline following a community report review.
          </p>
        </div>
      </div>
    );
  }

  return <JourneyCardView card={card} isOwner={isOwner} />;
}

export default async function JourneySlugPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page text-muted text-sm">
          Loading Journey Card...
        </div>
      }
    >
      <JourneyContent params={props.params} />
    </Suspense>
  );
}
