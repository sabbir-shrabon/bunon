/**
 * 1. Purpose: Feasibility warning sheet (Sheet 19) when estimated hours exceed 85% of available time.
 * 2. Spec Ref: Screen 19 in Category B, Section 3 UI Design Guide.
 * 3. Called By: OnboardingWizard, Screen17RoadmapPreview.
 * 4. Calls: BottomSheet, PrimaryButton, SecondaryButton.
 */

'use client';

import React from 'react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';

interface FeasibilitySheetProps {
  isOpen: boolean;
  onClose: () => void;
  requiredHours: number;
  availableHours: number;
  recommendedDeadline: string;
  onAcceptRecommendation: () => void;
  onKeepCurrent: () => void;
}

export function Sheet19Feasibility({
  isOpen,
  onClose,
  requiredHours,
  availableHours,
  recommendedDeadline,
  onAcceptRecommendation,
  onKeepCurrent,
}: FeasibilitySheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Pacing notice">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted leading-relaxed">
          This plan needs about{' '}
          <span className="font-semibold text-ink">
            {Math.round(requiredHours)} hours
          </span>
          , and your current schedule provides about{' '}
          <span className="font-semibold text-ink">
            {Math.round(availableHours)} hours
          </span>
          . Moving your deadline to{' '}
          <span className="font-semibold text-ink">
            {recommendedDeadline}
          </span>{' '}
          makes your weekly pace calm and achievable.
        </p>

        <div className="mt-4 flex flex-col gap-2.5">
          <PrimaryButton
            type="button"
            onClick={onAcceptRecommendation}
            className="w-full"
          >
            Move deadline to {recommendedDeadline}
          </PrimaryButton>

          <SecondaryButton
            type="button"
            onClick={onKeepCurrent}
            className="w-full"
          >
            Keep my current deadline
          </SecondaryButton>
        </div>
      </div>
    </BottomSheet>
  );
}
