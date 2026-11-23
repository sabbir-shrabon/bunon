/**
 * 1. Purpose: Written question screen for Q4 baseline, Q5 constraints, and AI follow-ups.
 * 2. Spec Ref: Screen 13 in Category B, Section 3 UI Design Guide.
 * 3. Called By: OnboardingWizard.
 * 4. Calls: PrimaryButton, StepHeader.
 */

'use client';

import React, { useState } from 'react';
import { PrimaryButton } from '@/components/ui/primary-button';
import { StepHeader } from '@/components/onboarding/step-header';

interface WrittenQuestionProps {
  questionNumber: number;
  totalSteps: number;
  title: string;
  whyWeAsk: string;
  placeholder: string;
  starterChips?: string[];
  initialValue?: string;
  isSkippable?: boolean;
  maxLength?: number;
  onBack: () => void;
  onNext: (answer: string) => void;
  onSkip?: () => void;
}

export function Screen13WrittenQuestions({
  questionNumber,
  totalSteps,
  title,
  whyWeAsk,
  placeholder,
  starterChips = [],
  initialValue = '',
  isSkippable = false,
  maxLength = 500,
  onBack,
  onNext,
  onSkip,
}: WrittenQuestionProps) {
  const [answer, setAnswer] = useState(initialValue);

  const handleChipClick = (chip: string) => {
    if (!answer.trim()) {
      setAnswer(chip);
    } else if (!answer.includes(chip)) {
      setAnswer(`${answer.trim()}, ${chip}`);
    }
  };

  const handleContinue = () => {
    if (!isSkippable && !answer.trim()) return;
    onNext(answer.trim());
  };

  const canContinue = isSkippable || answer.trim().length > 0;

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col">
      <div className="w-full max-w-[580px] mx-auto px-4 py-4 md:py-8 flex flex-col flex-1 pb-32">
        <StepHeader currentStep={questionNumber} totalSteps={totalSteps} onBack={onBack} />

        <div className="flex flex-col mt-4">
          <div className="rounded-[20px] border border-hairline bg-card p-6 shadow-none flex flex-col">
            <h1 className="text-[20px] font-semibold leading-[26px] tracking-tight text-ink">{title}</h1>
            <p className="text-[14px] leading-relaxed text-muted mt-2">{whyWeAsk}</p>

            <div className="mt-6 flex flex-col gap-2">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value.slice(0, maxLength))}
                placeholder={placeholder}
                rows={4}
                className="w-full p-4 rounded-xl bg-card border border-hairline text-ink placeholder:text-inactive text-[15px] resize-none focus:outline-none focus:border-ink transition-colors shadow-none"
              />
              <div className="flex justify-end text-xs text-muted px-1">
                {answer.length}/{maxLength}
              </div>
            </div>

            {starterChips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {starterChips.map((chip) => {
                  const isSelected = answer.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleChipClick(chip)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-ink text-page border-ink'
                          : 'bg-secondary-surface text-ink border-hairline hover:border-ink'
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Fixed Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full md:max-w-[580px] border-t md:border md:rounded-2xl border-hairline bg-card/95 backdrop-blur-md p-4 pb-[env(safe-area-inset-bottom,16px)] md:bottom-6 shadow-sm">
          <div className="flex flex-col items-center gap-2">
            {isSkippable && onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="text-xs text-muted hover:text-ink underline py-1 transition-colors cursor-pointer"
              >
                Skip for now
              </button>
            )}
            <PrimaryButton
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className="w-full"
            >
              Continue
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
