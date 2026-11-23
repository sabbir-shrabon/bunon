/**
 * 1. Purpose: Screen 12 (Q3 Working Days & Hours per Day) with stepper and custom weekday toggle.
 * 2. Spec Ref: Screen 12 in UI Design Guide.
 * 3. Called By: OnboardingWizard.
 * 4. Calls: PrimaryButton, StepHeader.
 */

'use client';

import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/primary-button';
import { StepHeader } from '@/components/onboarding/step-header';

const WEEKDAYS = [
  { index: 6, label: 'Sat' },
  { index: 0, label: 'Sun' },
  { index: 1, label: 'Mon' },
  { index: 2, label: 'Tue' },
  { index: 3, label: 'Wed' },
  { index: 4, label: 'Thu' },
  { index: 5, label: 'Fri' },
];

export function Screen12WorkingDays({
  initialDays = [],
  initialHours = 1.5,
  onContinue,
  onBack,
}: Readonly<{
  initialDays?: number[];
  initialHours?: number;
  onContinue: (workingDays: number[], hoursPerDay: number) => void;
  onBack?: () => void;
}>) {
  const [selectedDays, setSelectedDays] = useState<number[]>(initialDays);
  const [hours, setHours] = useState<number>(initialHours);
  const [showCustom, setShowCustom] = useState(false);
  const [error, setError] = useState('');

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex]
    );
    setError('');
  };

  const handleMinus = () => {
    setHours((h) => Math.max(0.5, Math.round((h - 0.5) * 10) / 10));
  };

  const handlePlus = () => {
    setHours((h) => Math.min(8.0, Math.round((h + 0.5) * 10) / 10));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length === 0) {
      setError('Please select at least one working day.');
      return;
    }
    onContinue(selectedDays, hours);
  };

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col">
      <div className="w-full max-w-[580px] mx-auto px-4 py-4 md:py-8 flex flex-col flex-1 pb-32">
        <StepHeader part={1} onBack={onBack} />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="rounded-[20px] border border-hairline bg-card p-6 shadow-none flex flex-col">
            <h1 className="text-[20px] font-semibold leading-[26px] tracking-tight text-ink">
              Which days will you work, and for how many hours?
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              Bunon plans tasks only on the days and hours you choose here.
            </p>

            {/* Working Days Row */}
            <div className="mt-6 flex flex-col">
              <span className="text-[12px] font-medium text-ink uppercase tracking-wider mb-2">
                Working days
              </span>
              <div className="flex items-center justify-between gap-1.5" role="group" aria-label="Select working days">
                {WEEKDAYS.map(({ index, label }) => {
                  const isSelected = selectedDays.includes(index);
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleDay(index)}
                      className={`h-11 flex-1 rounded-full text-[13px] font-semibold transition-colors cursor-pointer border ${
                        isSelected
                          ? 'bg-ink text-page border-ink'
                          : 'bg-card text-muted border-hairline hover:border-ink hover:text-ink'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stepper for Hours per Day */}
            <div className="mt-6 flex flex-col">
              <span className="text-[12px] font-medium text-ink uppercase tracking-wider mb-2">
                Hours per working day
              </span>
              <div className="flex items-center justify-between rounded-2xl border border-hairline bg-secondary-surface p-3">
                <button
                  type="button"
                  onClick={handleMinus}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-hairline text-ink hover:bg-page transition-colors cursor-pointer"
                  aria-label="Decrease hours"
                >
                  <Minus size={16} />
                </button>

                <div className="flex flex-col items-center">
                  <span className="text-[18px] font-bold text-ink">{hours.toFixed(1)} hrs</span>
                  <span className="text-[11px] text-muted">average per active day</span>
                </div>

                <button
                  type="button"
                  onClick={handlePlus}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-hairline text-ink hover:bg-page transition-colors cursor-pointer"
                  aria-label="Increase hours"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Quiet optional link */}
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setShowCustom(!showCustom)}
                className="text-[13px] text-muted hover:text-ink underline transition-colors cursor-pointer"
              >
                {showCustom ? 'Hide per-day breakdown' : 'Different hours on specific days?'}
              </button>
            </div>

            {showCustom && (
              <div className="mt-4 p-4 rounded-xl border border-hairline bg-secondary-surface text-[12px] text-muted leading-relaxed">
                You can fine-tune exact available minutes for each day of the week anytime on the dedicated{' '}
                <strong className="text-ink">What Bunon Knows</strong> page.
              </div>
            )}

            {error && <p className="mt-4 text-[13px] text-[#B42318]">{error}</p>}
          </div>

          {/* Bottom Fixed Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-30 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full md:max-w-[580px] border-t md:border md:rounded-2xl border-hairline bg-card/95 backdrop-blur-md p-4 pb-[env(safe-area-inset-bottom,16px)] md:bottom-6 shadow-sm">
            <PrimaryButton type="submit" className="w-full">
              Continue
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
