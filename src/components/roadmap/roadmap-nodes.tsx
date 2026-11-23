'use client';
/**
 * 1. Purpose: Renders the discrete Journey Map nodes along the continuous vertical Thread.
 * 2. Spec Ref: Stitch roadmap_journey_map Screen 50 and UI Design Guide Category E.
 * 3. Called By: RoadmapView.
 * 4. Calls: Lucide icons and Next.js link.
 */

import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

export function StartAnchor({
  startDate,
  onOpenBaseline,
}: Readonly<{
  startDate: string;
  onOpenBaseline: () => void;
}>) {
  const formatted = new Date(startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="relative flex items-start gap-4 mb-6 z-10">
      <div className="w-6 flex justify-center items-center pt-1 shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-[#8A8D94]" />
      </div>
      <div className="flex-1 pt-0.5">
        <button
          type="button"
          onClick={onOpenBaseline}
          className="inline-flex items-center text-[12px] text-muted hover:text-ink transition-colors cursor-pointer"
        >
          Started {formatted} · Then vs. Now ›
        </button>
      </div>
    </div>
  );
}

export function CompletedMilestoneNode({
  title,
  proofCount,
  onSelect,
}: Readonly<{
  title: string;
  proofCount: number;
  onSelect: () => void;
}>) {
  return (
    <div className="relative flex items-start gap-4 mb-6 z-10 cursor-pointer" onClick={onSelect}>
      <div className="w-6 flex justify-center items-center pt-0.5 shrink-0">
        <div className="w-5 h-5 rounded-full bg-[#FFB020] flex items-center justify-center ring-2 ring-card shadow-sm">
          <Check size={12} className="text-white" strokeWidth={3} />
        </div>
      </div>
      <div className="flex-1">
        <div className="text-[15px] font-semibold text-ink leading-tight">{title}</div>
        <div className="mt-1">
          <span className="text-[12px] text-muted hover:text-ink transition-colors">
            Reached · {proofCount} proof{proofCount === 1 ? '' : 's'} ›
          </span>
        </div>
      </div>
    </div>
  );
}

export function ActiveMilestoneCard({
  milestoneNumber,
  totalMilestones,
  title,
  expectedResult,
  proofCount,
  estimatedHours,
  onViewProofs,
}: Readonly<{
  milestoneNumber: number;
  totalMilestones: number;
  title: string;
  expectedResult: string;
  proofCount: number;
  estimatedHours: number;
  onViewProofs: () => void;
}>) {
  return (
    <div className="relative flex items-start gap-4 mb-6 z-10">
      <div className="w-6 flex justify-center items-center pt-3 shrink-0">
        <div className="w-5 h-5 rounded-full border-2 border-ink bg-card flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-ink" />
        </div>
      </div>
      <div className="flex-1 bg-card rounded-[20px] border border-hairline p-5 shadow-none">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted mb-1.5">
          You are here · Milestone {milestoneNumber} of {totalMilestones}
        </div>
        <h2 className="text-[18px] font-bold text-ink leading-snug mb-2">{title}</h2>
        <p className="text-[14px] leading-relaxed text-muted mb-4">{expectedResult}</p>
        <div className="pt-3 border-t border-hairline flex justify-between items-center text-[12px]">
          <span className="font-medium text-muted">
            {proofCount} proofs · {estimatedHours} hrs
          </span>
          <button
            type="button"
            onClick={onViewProofs}
            className="font-medium text-ink hover:opacity-75 transition-opacity cursor-pointer"
          >
            View proofs ›
          </button>
        </div>
      </div>
    </div>
  );
}

export function UpcomingMilestoneNode({
  title,
  onSelect,
}: Readonly<{
  title: string;
  onSelect: () => void;
}>) {
  return (
    <div className="relative flex items-start gap-4 mb-6 z-10 cursor-pointer" onClick={onSelect}>
      <div className="w-6 flex justify-center items-center pt-1 shrink-0">
        <div className="w-4 h-4 rounded-full border-2 border-[#8A8D94] bg-page" />
      </div>
      <div className="flex-1 pt-0.5">
        <div className="text-[15px] font-normal text-muted leading-tight">{title}</div>
      </div>
    </div>
  );
}

export function FinishDestinationAnchor({
  milestonesLeft,
  isEarned,
  journeyCardSlug,
}: Readonly<{
  milestonesLeft: number;
  isEarned: boolean;
  journeyCardSlug?: string;
}>) {
  return (
    <div className="relative flex items-start gap-4 z-10">
      <div className="w-6 flex justify-center items-center pt-1 shrink-0">
        <div className="w-4 h-4 rounded-full border-2 border-dashed border-[#8A8D94] bg-card" />
      </div>
      <div className="flex-1 pt-0.5 flex items-baseline">
        {isEarned && journeyCardSlug ? (
          <Link
            href={`/journey/${journeyCardSlug}`}
            className="text-[14px] font-semibold text-ink hover:opacity-80 transition-opacity"
          >
            Journey Card · Earned 🎓
          </Link>
        ) : (
          <>
            <span className="text-[14px] font-medium text-ink">Journey Card</span>
            <span className="text-[12px] text-[#8A8D94] ml-2">
              {milestonesLeft} milestone{milestonesLeft === 1 ? '' : 's'} to go
            </span>
          </>
        )}
      </div>
    </div>
  );
}
