/**
 * 1. Purpose: Stepper navigation bar with Thread progress indicator and escape hatch.
 * 2. Spec Ref: Stitch onboarding_q1_goal_and_why Sub-Header & Screens 10–13.
 * 3. Called By: Onboarding wizard.
 * 4. Calls: next/link, Lucide ArrowLeft.
 */

'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function StepHeader({
  part,
  currentStep,
  totalSteps,
  onBack,
}: Readonly<{
  part?: 1 | 2;
  currentStep?: number;
  totalSteps?: number;
  onBack?: () => void;
}>) {
  const isPartMode = part !== undefined;
  const partText = isPartMode
    ? part === 1
      ? 'Part 1 of 2: Your basics'
      : 'Part 2 of 2: Your path'
    : currentStep && totalSteps
    ? `Step ${currentStep} of ${totalSteps}`
    : 'Building your plan';

  return (
    <header className="flex h-14 items-center justify-between border-b border-hairline bg-card px-4">
      {onBack ? (
        <button
          type="button"
          aria-label="Go back"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-secondary-surface transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
      ) : (
        <div className="w-8" />
      )}

      <div className="flex flex-col items-center justify-center gap-1">
        <span className="text-[12px] font-medium text-muted">{partText}</span>
        <div className="flex items-center gap-1 w-20">
          <div
            className={`h-1 flex-1 rounded-full ${
              (part && part >= 1) || (currentStep && currentStep >= 1)
                ? 'bg-[#1A1A1B] dark:bg-white'
                : 'bg-secondary-surface'
            }`}
          />
          <div
            className={`h-1 flex-1 rounded-full ${
              (part && part >= 2) || (currentStep && totalSteps && currentStep >= totalSteps / 2)
                ? 'bg-[#1A1A1B] dark:bg-white'
                : 'bg-secondary-surface'
            }`}
          />
        </div>
      </div>

      <Link
        href="/today"
        className="text-[12px] font-medium text-muted hover:text-ink transition-colors"
      >
        Not now, go to Today
      </Link>
    </header>
  );
}
