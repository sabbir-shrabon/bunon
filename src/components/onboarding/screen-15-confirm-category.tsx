/**
 * 1. Purpose: Confirm the goal category screen before AI follow-ups and roadmap generation.
 * 2. Spec Ref: Screen 15 in Category B, Section 3 UI Design Guide.
 * 3. Called By: OnboardingWizard.
 * 4. Calls: PrimaryButton, StepHeader.
 */

'use client';

import React, { useState } from 'react';
import { PrimaryButton } from '@/components/ui/primary-button';
import { StepHeader } from '@/components/onboarding/step-header';

interface ConfirmCategoryProps {
  detectedCategory: string;
  onBack: () => void;
  onConfirm: (category: string) => void;
}

const CATEGORIES = [
  { key: 'FITNESS', label: 'Fitness & Health' },
  { key: 'WORK', label: 'Work & Career' },
  { key: 'BUSINESS', label: 'Business & Project' },
  { key: 'ENTREPRENEURSHIP', label: 'Entrepreneurship' },
  { key: 'OTHER', label: 'Other' },
];

export function Screen15ConfirmCategory({
  detectedCategory,
  onBack,
  onConfirm,
}: ConfirmCategoryProps) {
  const [selected, setSelected] = useState(detectedCategory || 'OTHER');

  const selectedCategoryLabel =
    CATEGORIES.find((c) => c.key === selected)?.label || selected;

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col">
      <div className="w-full max-w-[580px] mx-auto px-4 py-4 md:py-8 flex flex-col flex-1 pb-32">
        <StepHeader part={2} onBack={onBack} />

        <div className="flex flex-col mt-4">
          <div className="rounded-[20px] border border-hairline bg-card p-6 shadow-none flex flex-col">
            <h1 className="text-[20px] font-semibold leading-[26px] tracking-tight text-ink">
              This looks like a {selectedCategoryLabel} goal. Right?
            </h1>
            <p className="text-[14px] leading-relaxed text-muted mt-2">
              This helps Bunon match the best structure and milestone pacing for your focus area.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {CATEGORIES.map((cat) => {
                const isSelected = selected === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelected(cat.key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-ink text-page border-ink'
                        : 'bg-secondary-surface text-ink border-hairline hover:border-ink'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Fixed Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full md:max-w-[580px] border-t md:border md:rounded-2xl border-hairline bg-card/95 backdrop-blur-md p-4 pb-[env(safe-area-inset-bottom,16px)] md:bottom-6 shadow-sm">
          <PrimaryButton
            type="button"
            onClick={() => onConfirm(selected)}
            className="w-full"
          >
            Yes, continue
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
