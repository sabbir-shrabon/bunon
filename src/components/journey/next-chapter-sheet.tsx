'use client';
/**
 * 1. Purpose: Displays Sheet 101 Goal 2 Bridge with 3 tailored next-chapter suggestions from Pipeline 7.
 * 2. Spec Ref: UI Design Guide Category H Sheet 101 and Pipeline 7.
 * 3. Called By: JourneyCardView and GoalFinishSheet.
 * 4. Calls: BottomSheet, useRouter, and Lucide icons.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Compass } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';

interface NextGoalSuggestion {
  suggested_title: string;
  suggested_why: string;
  suggested_category: string;
  suggested_execution_mode: 'deliverable_queue' | 'daily_quota';
  suggested_weeks: number;
  why_this_fits_you: string;
}

interface NextChapterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: NextGoalSuggestion[];
}

export function NextChapterSheet({
  isOpen,
  onClose,
  suggestions,
}: Readonly<NextChapterSheetProps>) {
  const router = useRouter();

  const handleSelectSuggestion = (s: NextGoalSuggestion) => {
    onClose();
    const query = new URLSearchParams({
      prefillTitle: s.suggested_title,
      prefillWhy: s.suggested_why,
      prefillCategory: s.suggested_category,
      prefillMode: s.suggested_execution_mode,
      prefillWeeks: String(s.suggested_weeks),
    });
    router.push(`/onboarding?${query.toString()}`);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Ready for your next chapter?">
      <div className="flex flex-col gap-4 pb-2">
        <p className="text-[13.5px] text-muted leading-relaxed">
          Finishing Chapter 1 makes the next goal easier. Based on what you proved, here are 3 natural next blocks:
        </p>

        {/* 3 Tailored Next-Chapter Goal Cards */}
        <div className="flex flex-col gap-2.5">
          {suggestions.map((s) => (
            <button
              key={s.suggested_title}
              type="button"
              onClick={() => handleSelectSuggestion(s)}
              className="p-4 rounded-[16px] bg-card border border-hairline hover:bg-secondary-surface text-left transition-colors cursor-pointer group flex items-center justify-between"
            >
              <div className="pr-3">
                <div className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1">
                  {s.suggested_weeks} weeks · {s.suggested_category}
                </div>
                <div className="text-[15px] font-bold text-ink mb-1 group-hover:underline">
                  {s.suggested_title}
                </div>
                <div className="text-[12.5px] text-muted leading-relaxed">
                  {s.why_this_fits_you}
                </div>
              </div>
              <ArrowRight size={18} className="text-muted group-hover:text-ink shrink-0" />
            </button>
          ))}
        </div>

        {/* Bottom Options */}
        <div className="flex flex-col gap-2 pt-2 border-t border-hairline text-center">
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push('/onboarding');
            }}
            className="h-11 w-full rounded-full border border-hairline text-[13px] font-medium text-ink hover:bg-secondary-surface transition-colors cursor-pointer"
          >
            Start a different goal from scratch
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] text-muted hover:text-ink py-1 transition-colors cursor-pointer"
          >
            Take a break for now
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
