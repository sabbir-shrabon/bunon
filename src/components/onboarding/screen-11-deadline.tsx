/**
 * 1. Purpose: Screen 11 (Q2 Target Deadline) enforcing strictly 28 to 365 days duration.
 * 2. Spec Ref: Screen 11 in UI Design Guide.
 * 3. Called By: OnboardingWizard.
 * 4. Calls: PrimaryButton, StepHeader.
 */

'use client';

import React, { useState } from 'react';
import { PrimaryButton } from '@/components/ui/primary-button';
import { StepHeader } from '@/components/onboarding/step-header';

function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function Screen11Deadline({
  initialDeadline,
  onContinue,
  onBack,
}: Readonly<{
  initialDeadline?: string;
  onContinue: (deadlineDate: string, totalWeeks: number) => void;
  onBack?: () => void;
}>) {
  const today = new Date();
  const minDate = new Date();
  minDate.setDate(today.getDate() + 28); // 4 weeks minimum

  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 365); // 12 months maximum

  const minStr = formatDateInput(minDate);
  const maxStr = formatDateInput(maxDate);

  const defaultDate = initialDeadline || minStr;
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [error, setError] = useState('');

  const calculateWeeks = (dateStr: string): number => {
    const target = new Date(dateStr);
    const diffMs = target.getTime() - today.getTime();
    return Math.max(4, Math.round(diffMs / (1000 * 60 * 60 * 24 * 7)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      setError('Please select a deadline.');
      return;
    }
    if (selectedDate < minStr || selectedDate > maxStr) {
      setError('Deadlines must be between 4 weeks (28 days) and 12 months.');
      return;
    }
    const weeks = calculateWeeks(selectedDate);
    onContinue(selectedDate, weeks);
  };

  const weeks = selectedDate ? calculateWeeks(selectedDate) : 4;

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col">
      <div className="w-full max-w-[580px] mx-auto px-4 py-4 md:py-8 flex flex-col flex-1 pb-32">
        <StepHeader part={1} onBack={onBack} />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="rounded-[20px] border border-hairline bg-card p-6 shadow-none flex flex-col">
            <h1 className="text-[20px] font-semibold leading-[26px] tracking-tight text-ink">
              What is your deadline?
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              Bunon is built for long-term goals taking 4 weeks to 12 months.
            </p>

            <div className="mt-6 flex flex-col">
              <label htmlFor="deadline-picker" className="text-[12px] font-medium text-ink uppercase tracking-wider mb-2">
                Target date
              </label>
              <input
                id="deadline-picker"
                type="date"
                required
                min={minStr}
                max={maxStr}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setError('');
                }}
                className="h-12 w-full rounded-xl border border-hairline bg-card px-4 text-[15px] text-ink focus:outline-none focus:border-ink cursor-pointer transition-colors"
              />
              <p className="mt-2 text-[13px] text-muted">
                That gives you about <span className="font-semibold text-ink">{weeks} weeks</span> to complete this goal.
              </p>
            </div>

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
