'use client';
/**
 * 1. Purpose: Client view for Screen 97 Journey Card earned & social photocard page.
 * 2. Spec Ref: Stitch journey_card Screen 97 and UI Design Guide Category H.
 * 3. Called By: /journey/[slug] and /journey-card pages.
 * 4. Calls: AppShell, PhotocardCanvas1080x1350, JourneyPrivacySheet, and NextChapterSheet.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, Share2 } from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';
import { PhotocardCanvas1080x1350 } from '@/components/photocard/PhotocardCanvas1080x1350';
import { JourneyPrivacySheet } from './journey-privacy-sheet';
import { NextChapterSheet } from './next-chapter-sheet';
import type { JourneyCardVisibility } from '@/types/domain';

interface JourneyCardViewProps {
  card: {
    id: string;
    public_slug: string;
    journey_card_headline: string;
    day1_vs_now_story: string;
    comeback_highlight_line?: string | null;
    visibility: JourneyCardVisibility;
    featuredEvidence?: Array<{ id: string; url: string; caption?: string }>;
    next_goal_suggestions_json?: unknown[];
    userName?: string;
    goals?: {
      title: string;
      streak_weeks?: number;
      created_at: string;
      completed_at?: string;
    };
  };
  isOwner?: boolean;
}

export function JourneyCardView({ card, isOwner = true }: Readonly<JourneyCardViewProps>) {
  const router = useRouter();
  const [visibility, setVisibility] = useState<JourneyCardVisibility>(card.visibility);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isNextChapterOpen, setIsNextChapterOpen] = useState(false);

  const goalTitle = card.goals?.title || 'Bunon Goal';
  const proof1 = card.featuredEvidence?.[0]?.url;
  const proof2 = card.featuredEvidence?.[1]?.url || card.featuredEvidence?.[0]?.url;

  return (
    <AppShell>
      <div className="flex flex-col w-full max-w-[428px] md:max-w-[640px] mx-auto px-4 pt-4 pb-24 md:pb-12">
        {/* Top Header */}
        <div className="h-14 flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => router.back()}
              className="w-10 h-10 -ml-2 flex items-center justify-center text-ink hover:opacity-75 transition-opacity cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-[18px] font-bold text-ink">Journey Card</h1>
          </div>

          {isOwner && (
            <button
              type="button"
              aria-label="Share or privacy options"
              onClick={() => setIsPrivacyOpen(true)}
              className="w-10 h-10 flex items-center justify-center text-ink hover:bg-secondary-surface rounded-full transition-colors cursor-pointer"
            >
              <Share2 size={18} />
            </button>
          )}
        </div>

        {/* 1080x1350 Photocard Canvas Component */}
        <PhotocardCanvas1080x1350
          goalTitle={goalTitle}
          userName={card.userName}
          chapterBadge="Chapter 1 Finished"
          wittyLine="Survived tuition crunches and 11 PM sprints to finish."
          minimalLine={card.journey_card_headline}
          storyLine={card.day1_vs_now_story}
          proof1Url={proof1}
          proof2Url={proof2}
          statPills={['Completed', `${card.goals?.streak_weeks || 1}w Streak`, 'Verified Proofs']}
        />

        {/* What's Next Bridge Link */}
        {isOwner && (
          <div className="w-full max-w-[340px] mx-auto mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsNextChapterOpen(true)}
              className="text-[13px] font-medium text-muted hover:text-ink transition-colors py-2 cursor-pointer inline-flex items-center gap-1"
            >
              <span>What&apos;s next? Start Chapter 2</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>

      {/* Sheet 100: Privacy & Link Share */}
      <JourneyPrivacySheet
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        publicSlug={card.public_slug}
        initialVisibility={visibility}
        onVisibilityChanged={(newVis) => setVisibility(newVis)}
      />

      {/* Sheet 101: Next Chapter Bridge */}
      <NextChapterSheet
        isOpen={isNextChapterOpen}
        onClose={() => setIsNextChapterOpen(false)}
        suggestions={(card.next_goal_suggestions_json as never[]) || []}
      />
    </AppShell>
  );
}
