'use client';
/**
 * 1. Purpose: Renders Sheet 57 'Feeling like stopping?' with zero-guilt Shrink, Pivot, or Archive paths.
 * 2. Spec Ref: UI Design Guide Category E Sheet 57 and Section 6.
 * 3. Called By: RoadmapView GoalMenu.
 * 4. Calls: BottomSheet, PrimaryButton, and /api/goals/[id]/rescue.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Scissors, Sparkles } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';

interface RescueSheetProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: string;
}

export function RescueSheet({ isOpen, onClose, goalId }: Readonly<RescueSheetProps>) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (action: 'SHRINK_TO_MVG' | 'PIVOT_STRATEGY' | 'ARCHIVE') => {
    setIsSubmitting(true);
    try {
      if (action === 'ARCHIVE') {
        const res = await fetch(`/api/goals/${goalId}/rescue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ARCHIVE', reason: 'User archived from rescue sheet' }),
        });
        if (res.ok) {
          onClose();
          router.push('/goals');
        }
      } else {
        onClose();
        router.push(`/roadmap/replan?goalId=${goalId}&reason=${action}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Feeling like stopping?">
      <div className="flex flex-col gap-3.5 pb-2">
        <p className="text-[13.5px] text-muted leading-relaxed">
          Life changes, and stopping a plan that is no longer working is honest. Choose what feels right for you:
        </p>

        {/* Option 1: Shrink to MVG (Recommended) */}
        <div className="p-4 rounded-[16px] border border-hairline bg-card flex flex-col gap-2">
          <div className="flex items-center gap-2 font-semibold text-[14px] text-ink">
            <Scissors size={16} className="text-[#FFB020]" />
            <span>Shrink to Minimum Viable Goal (Recommended)</span>
          </div>
          <p className="text-[12.5px] text-muted leading-relaxed">
            Cuts remaining scope to the essential 30–50% core deliverables so you finish something tangible instead of quitting empty-handed.
          </p>
          <PrimaryButton onClick={() => handleAction('SHRINK_TO_MVG')} disabled={isSubmitting}>
            Shrink to MVG & re-plan
          </PrimaryButton>
        </div>

        {/* Option 2: Pivot Strategy */}
        <div className="p-4 rounded-[16px] border border-hairline bg-card flex flex-col gap-2">
          <div className="flex items-center gap-2 font-semibold text-[14px] text-ink">
            <Sparkles size={16} className="text-muted" />
            <span>Change the strategy, keep the goal</span>
          </div>
          <p className="text-[12.5px] text-muted leading-relaxed">
            Keep your end result, but discard the current roadmap strategy in favor of a fresher, more practical approach.
          </p>
          <button
            type="button"
            onClick={() => handleAction('PIVOT_STRATEGY')}
            disabled={isSubmitting}
            className="h-11 w-full rounded-full border border-hairline text-[13.5px] font-medium text-ink hover:bg-secondary-surface transition-colors cursor-pointer"
          >
            Change strategy
          </button>
        </div>

        {/* Option 3: Archive */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => handleAction('ARCHIVE')}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted hover:text-ink transition-colors cursor-pointer"
          >
            <Archive size={14} />
            <span>Archive this goal without guilt (save past proofs)</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
