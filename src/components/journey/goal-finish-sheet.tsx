'use client';
/**
 * 1. Purpose: Displays 100% free Sheet 99 Goal finished celebration with Day 1 vs. Now story.
 * 2. Spec Ref: UI Design Guide Category H Sheet 99 and Stitch journey_card.
 * 3. Called By: Today completion and /today all done state.
 * 4. Calls: BottomSheet, PrimaryButton, and useRouter.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { Award } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';

interface GoalFinishSheetProps {
  isOpen: boolean;
  onClose: () => void;
  goalTitle: string;
  day1VsNowStory: string;
  publicSlug: string;
  onOpenNextChapter: () => void;
}

export function GoalFinishSheet({
  isOpen,
  onClose,
  goalTitle,
  day1VsNowStory,
  publicSlug,
  onOpenNextChapter,
}: Readonly<GoalFinishSheetProps>) {
  const router = useRouter();

  const handleViewCard = () => {
    onClose();
    router.push(`/journey/${publicSlug}`);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Goal Accomplished!">
      <div className="flex flex-col items-center text-center gap-4 pb-2">
        {/* Marigold Seal Knot */}
        <div className="w-14 h-14 rounded-full bg-[#FFB020] text-white flex items-center justify-center shadow-lg select-none">
          <Award size={28} />
        </div>

        <div>
          <h2 className="text-[20px] font-bold text-ink">{goalTitle} Complete</h2>
          <p className="text-[14px] text-muted leading-relaxed mt-2 max-w-[340px]">
            {day1VsNowStory || 'You have turned daily steps into a finished, proven chapter.'}
          </p>
        </div>

        <div className="p-3.5 rounded-[16px] bg-secondary-surface text-[12px] text-muted w-full">
          Your Journey Card is 100% free and ready to save or share.
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 w-full pt-1">
          <PrimaryButton onClick={handleViewCard}>
            View &amp; share my Journey Card
          </PrimaryButton>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenNextChapter();
            }}
            className="h-[52px] w-full rounded-full border border-hairline text-[14px] font-medium text-ink hover:bg-secondary-surface transition-colors cursor-pointer"
          >
            See what&apos;s next (Chapter 2)
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
