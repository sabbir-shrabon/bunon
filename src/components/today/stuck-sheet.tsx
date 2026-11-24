/**
 * 1. Purpose: Consolidated 'Stuck or short on time?' rescue bottom sheet (Sheet 37b).
 * 2. Spec Ref: Stitch stuck_bottom_sheet code.html & screen.png.
 * 3. Called By: HeroTaskCard 'Stuck or short on time?' link.
 * 4. Calls: BottomSheet, PrimaryButton, and task adjustment endpoints.
 */

'use client';

import { useState } from 'react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';

interface StuckSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isDailyCore?: boolean;
  on10MinVersion: () => Promise<void>;
  onSkipBasic: () => Promise<void>;
  onAdjustSchedule: (reason: string) => Promise<void>;
}

const STUCK_REASONS = [
  { label: 'Too tired', key: 'TOO_TIRED' },
  { label: "Didn't understand", key: 'DID_NOT_UNDERSTAND' },
  { label: 'No time today', key: 'NO_TIME' },
  { label: "Doesn't feel useful", key: 'NOT_USEFUL' },
  { label: "Don't feel like it", key: 'LOW_MOTIVATION' },
];

export function StuckSheet({
  isOpen,
  onClose,
  isDailyCore = false,
  on10MinVersion,
  onSkipBasic,
  onAdjustSchedule,
}: Readonly<StuckSheetProps>) {
  const [selectedReason, setSelectedReason] = useState<string>('TOO_TIRED');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdjust = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onAdjustSchedule(selectedReason);
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Could not adjust schedule right now. You can use the 10-minute version instead.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle10Min = async () => {
    setIsSubmitting(true);
    try {
      await on10MinVersion();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      await onSkipBasic();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col text-center px-2 pt-1 pb-4">
        {/* Drag Handle */}
        <div className="w-9 h-1 rounded-full bg-hairline mb-4 mx-auto" />

        {/* Sheet Header */}
        <h2 className="text-[20px] font-semibold text-ink leading-[26px] mb-1.5">
          What feels stuck?
        </h2>
        <p className="text-[13px] text-muted mb-5 px-3">
          Pick the closest feeling. Bunon will adjust your pace or split the work.
        </p>

        {/* Instant $0 10-Minute Version / Fast Zero-Prep Option */}
        <div className="mb-4 flex justify-center">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handle10Min}
            className="w-full max-w-xs h-[44px] rounded-full border border-hairline bg-[var(--page)] hover:bg-[var(--secondary-surface)] text-[13px] font-medium text-ink flex items-center justify-center transition-colors cursor-pointer"
          >
            {isDailyCore ? 'Fast zero-prep swap' : 'Do the 10-minute version'}
          </button>
        </div>

        {/* Tappable Reason Chips */}
        <div
          role="radiogroup"
          aria-label="Reasons for feeling stuck"
          className="flex flex-wrap gap-2 justify-center px-1 mb-6"
        >
          {STUCK_REASONS.map((r) => {
            const isSelected = selectedReason === r.key;
            return (
              <button
                key={r.key}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={isSubmitting}
                onClick={() => setSelectedReason(r.key)}
                className={`text-[13px] font-medium px-4 py-2 rounded-full transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-ink text-[var(--card)]'
                    : 'bg-[var(--page)] text-muted hover:text-ink border border-hairline/60'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {errorMessage && (
          <p className="mb-3 rounded-xl border border-hairline bg-secondary-surface/50 px-3 py-2 text-[12px] text-ink leading-relaxed">
            {errorMessage}
          </p>
        )}

        {/* Solid Black Primary CTA */}
        <div className="w-full flex justify-center mb-3">
          <PrimaryButton onClick={handleAdjust} disabled={isSubmitting}>
            {isSubmitting ? 'Adjusting…' : 'Adjust my schedule'}
          </PrimaryButton>
        </div>

        {/* Divider */}
        <div className="h-px bg-hairline/60 mx-4 my-2" />

        {/* Secondary Quiet Link: Skip — too basic */}
        <div className="pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSkip}
            className="text-[13px] font-medium text-muted hover:text-ink transition-colors cursor-pointer"
          >
            Skip — too basic (unlocks next task)
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
