/**
 * 1. Purpose: Unified collapsible step-by-step guide directly under the Main Task Title in HeroCard.
 * 2. Spec Ref: Stitch today_cleanest_2_beat_thread & today_inline_sub_steps_expanded.
 * 3. Called By: HeroTaskCard in Today view.
 * 4. Calls: Pure UI markup and onToggleSubstep callback.
 */

'use client';

import { useState } from 'react';
import type { SubStepItem, StepSlicerResult } from '@/types/domain';

interface BeatOneDoProps {
  steps: SubStepItem[];
  adaptiveSlice: StepSlicerResult | null;
  planStyle: string;
  onToggleSubstep: (stepNumber: number, done: boolean) => Promise<void>;
  onProofClick?: () => void;
}

export function BeatOneDo({
  steps,
  adaptiveSlice,
  planStyle,
  onToggleSubstep,
  onProofClick,
}: Readonly<BeatOneDoProps>) {
  const [togglingStep, setTogglingStep] = useState<number | null>(null);

  if (!steps || steps.length === 0) return null;

  const totalSteps = steps.length;

  const handleToggle = async (stepNumber: number, currentDone: boolean) => {
    if (stepNumber === totalSteps) {
      onProofClick?.();
      return;
    }
    setTogglingStep(stepNumber);
    try {
      await onToggleSubstep(stepNumber, !currentDone);
    } finally {
      setTogglingStep(null);
    }
  };

  return (
    <div className="w-full rounded-[14px] bg-[var(--page)] border border-hairline/60 p-3.5 mb-2 flex flex-col gap-2.5 animate-in fade-in duration-200">
      <div className="text-[12px] font-semibold text-muted mb-0.5">
        How to do this · {totalSteps} step{totalSteps === 1 ? '' : 's'}
      </div>

      <div className="flex flex-col gap-2.5 px-0.5">
        {steps.map((step) => {
          const isFinal = step.step_number === totalSteps;
          const isToggling = togglingStep === step.step_number;

          return (
            <div key={step.step_number} className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  aria-label={step.done ? `Step ${step.step_number} done` : `Toggle Step ${step.step_number}`}
                  disabled={isToggling}
                  onClick={() => handleToggle(step.step_number, step.done)}
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                    step.done
                      ? 'bg-[var(--marigold)] text-white'
                      : 'border-2 border-[var(--inactive)] bg-card hover:border-ink'
                  }`}
                >
                  {step.done && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 10 10">
                      <path d="M2 5.2L4.2 7.5L8 2.5" />
                    </svg>
                  )}
                </button>
                <span
                  onClick={() => handleToggle(step.step_number, step.done)}
                  className={`text-[13px] leading-[18px] cursor-pointer select-none flex-1 min-w-0 ${
                    step.done ? 'line-through text-muted' : 'text-ink font-normal'
                  }`}
                >
                  {step.text}
                  {isFinal && !step.done && (
                    <span className="ml-1.5 text-[11px] text-muted font-normal">
                      (requires proof to finish)
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-medium text-muted shrink-0">
                  {step.minutes || 15}m
                </span>
              </div>

              {/* Rest Banner in DAILY_ADAPTIVE mode */}
              {planStyle === 'DAILY_ADAPTIVE' &&
                adaptiveSlice?.restBannerMessage &&
                step.step_number === adaptiveSlice.todaySliceCount && (
                  <div className="bg-card border border-hairline rounded-lg p-2 text-center my-1">
                    <p className="text-[12px] font-medium text-muted">
                      {adaptiveSlice.restBannerMessage}
                    </p>
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
