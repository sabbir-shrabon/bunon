'use client';
/**
 * 1. Purpose: Bottom sheet for filtering the timeline feed by Goal and Proof type.
 * 2. Spec Ref: UI Design Guide Category F Sheet 63 (Timeline filter).
 * 3. Called By: TimelineView header Filter icon.
 * 4. Calls: BottomSheet and PrimaryButton.
 */

import React, { useState } from 'react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';

interface TimelineFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Array<{ id: string; title: string }>;
  selectedGoalId?: string;
  selectedProofType?: string;
  onApply: (goalId?: string, proofType?: string) => void;
}

const PROOF_TYPES = [
  { value: 'ALL', label: 'All' },
  { value: 'PHOTO', label: 'Photo' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'FILE', label: 'File' },
  { value: 'LINK', label: 'Link' },
  { value: 'NOTE', label: 'Note' },
];

export function TimelineFilterSheet({
  isOpen,
  onClose,
  goals,
  selectedGoalId,
  selectedProofType = 'ALL',
  onApply,
}: Readonly<TimelineFilterSheetProps>) {
  const [goalId, setGoalId] = useState<string | undefined>(selectedGoalId);
  const [proofType, setProofType] = useState<string>(selectedProofType);

  const handleReset = () => {
    setGoalId(undefined);
    setProofType('ALL');
  };

  const handleApply = () => {
    onApply(goalId, proofType);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Filter timeline">
      <div className="flex flex-col gap-4 pb-2">
        <div className="flex justify-between items-center">
          <span className="text-[12px] font-semibold text-ink">Filter Groups</span>
          <button
            type="button"
            onClick={handleReset}
            className="text-[12px] text-muted hover:text-ink transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>

        {/* Group 1: Goal Filter (shown if multiple goals) */}
        {goals.length > 1 && (
          <div>
            <label className="text-[12px] font-medium text-muted block mb-2">Goal</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setGoalId(undefined)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                  !goalId
                    ? 'bg-[#1A1A1B] text-white dark:bg-[#EDEEEF] dark:text-[#0E0F11]'
                    : 'bg-secondary-surface text-muted hover:text-ink'
                }`}
              >
                All goals
              </button>
              {goals.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoalId(g.id)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                    goalId === g.id
                      ? 'bg-[#1A1A1B] text-white dark:bg-[#EDEEEF] dark:text-[#0E0F11]'
                      : 'bg-secondary-surface text-muted hover:text-ink'
                  }`}
                >
                  {g.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Group 2: Proof Type */}
        <div>
          <label className="text-[12px] font-medium text-muted block mb-2">Proof type</label>
          <div className="flex flex-wrap gap-1.5">
            {PROOF_TYPES.map((pt) => (
              <button
                key={pt.value}
                type="button"
                onClick={() => setProofType(pt.value)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                  proofType === pt.value
                    ? 'bg-[#1A1A1B] text-white dark:bg-[#EDEEEF] dark:text-[#0E0F11]'
                    : 'bg-secondary-surface text-muted hover:text-ink'
                }`}
              >
                {pt.label}
              </button>
            ))}
          </div>
        </div>

        <PrimaryButton onClick={handleApply}>Apply filter</PrimaryButton>
      </div>
    </BottomSheet>
  );
}
