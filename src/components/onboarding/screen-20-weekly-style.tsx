/**
 * 1. Purpose: Screen 20 Choose weekly style with live sample week preview & reminder time.
 * 2. Spec Ref: Screen 20 in Category B, Section 3 UI Design Guide.
 * 3. Called By: OnboardingWizard.
 * 4. Calls: PrimaryButton, StepHeader.
 */

'use client';

import React, { useState } from 'react';
import { Check, Clock, ShieldCheck } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/primary-button';
import { StepHeader } from '@/components/onboarding/step-header';

interface WeeklyStyleProps {
  category: string;
  recommendedStyle: 'FLEXIBLE_WEEK' | 'DAILY_ADAPTIVE';
  onBack: () => void;
  onSubmit: (style: 'FLEXIBLE_WEEK' | 'DAILY_ADAPTIVE', reminderTime: string) => Promise<void>;
}

const REMINDER_TIMES = [
  '07:00 AM',
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
  '09:00 PM',
];

export function Screen20WeeklyStyle({
  category,
  recommendedStyle,
  onBack,
  onSubmit,
}: WeeklyStyleProps) {
  const [selectedStyle, setSelectedStyle] = useState<'FLEXIBLE_WEEK' | 'DAILY_ADAPTIVE'>(
    recommendedStyle || 'DAILY_ADAPTIVE'
  );
  const [reminderTime, setReminderTime] = useState('08:00 AM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(selectedStyle, reminderTime);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col">
      <div className="w-full max-w-[580px] mx-auto px-4 py-4 md:py-8 flex flex-col flex-1 pb-32">
        <StepHeader part={2} onBack={onBack} />

        <main className="flex flex-col gap-6 mt-4">
          <div>
            <h1 className="text-[20px] font-semibold leading-[26px] tracking-tight text-ink">
              How should Bunon lay out your weeks?
            </h1>
            <p className="text-[14px] leading-relaxed text-muted mt-2">
              Choose how you prefer your milestones broken down into daily actions.
            </p>
          </div>

          {/* Style Selection Cards */}
          <div className="flex flex-col gap-4">
            {/* Card 1: Flexible Weekly Queue */}
            <div
              onClick={() => setSelectedStyle('FLEXIBLE_WEEK')}
              className={`p-4 rounded-2xl bg-card border cursor-pointer transition-all ${
                selectedStyle === 'FLEXIBLE_WEEK'
                  ? 'border-ink ring-1 ring-ink'
                  : 'border-hairline hover:border-ink'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedStyle === 'FLEXIBLE_WEEK'
                        ? 'border-ink bg-ink'
                        : 'border-hairline'
                    }`}
                  >
                    {selectedStyle === 'FLEXIBLE_WEEK' && <Check className="w-2.5 h-2.5 text-page" />}
                  </div>
                  <span className="text-sm font-semibold text-ink">Flexible weekly queue</span>
                </div>
                {recommendedStyle === 'FLEXIBLE_WEEK' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-surface font-medium text-muted">
                    Recommended for {category || 'your goal'}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-2">
                Work any day in bursts; no daily schedule locks. Deliverables queued per week.
              </p>

              {/* Live Sample Week Miniature Preview */}
              <div className="mt-3 p-3 rounded-xl bg-secondary-surface border border-hairline flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted font-medium">
                  Sample Week Preview
                </span>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between py-1 px-2 rounded-lg bg-card border border-hairline text-ink">
                    <span className="truncate">Deliverable 1: Core foundation draft</span>
                    <span className="text-muted shrink-0 ml-2">45m</span>
                  </div>
                  <div className="flex justify-between py-1 px-2 rounded-lg bg-card border border-hairline text-ink">
                    <span className="truncate">Deliverable 2: Working implementation</span>
                    <span className="text-muted shrink-0 ml-2">60m</span>
                  </div>
                  <div className="flex justify-between py-1 px-2 rounded-lg bg-card border border-hairline text-ink">
                    <span className="truncate">Deliverable 3: Verification & test step</span>
                    <span className="text-muted shrink-0 ml-2">30m</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Daily Adaptive Steps */}
            <div
              onClick={() => setSelectedStyle('DAILY_ADAPTIVE')}
              className={`p-4 rounded-2xl bg-card border cursor-pointer transition-all ${
                selectedStyle === 'DAILY_ADAPTIVE'
                  ? 'border-ink ring-1 ring-ink'
                  : 'border-hairline hover:border-ink'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedStyle === 'DAILY_ADAPTIVE'
                        ? 'border-ink bg-ink'
                        : 'border-hairline'
                    }`}
                  >
                    {selectedStyle === 'DAILY_ADAPTIVE' && <Check className="w-2.5 h-2.5 text-page" />}
                  </div>
                  <span className="text-sm font-semibold text-ink">Daily adaptive steps</span>
                </div>
                {recommendedStyle === 'DAILY_ADAPTIVE' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-surface font-medium text-muted">
                    Recommended for {category || 'your goal'}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-2">
                Calibrated 20–35m steps mapped across your selected working days.
              </p>

              {/* Live Sample Week Miniature Preview */}
              <div className="mt-3 p-3 rounded-xl bg-secondary-surface border border-hairline flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted font-medium">
                  Sample Week Preview
                </span>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between py-1 px-2 rounded-lg bg-card border border-hairline text-ink">
                    <span className="truncate">
                      <strong className="text-muted mr-1">Day 1:</strong> Initial 25m focus step
                    </span>
                    <span className="text-muted shrink-0 ml-2">25m</span>
                  </div>
                  <div className="flex justify-between py-1 px-2 rounded-lg bg-card border border-hairline text-ink">
                    <span className="truncate">
                      <strong className="text-muted mr-1">Day 2:</strong> Guided execution step
                    </span>
                    <span className="text-muted shrink-0 ml-2">20m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Reminder Settings */}
          <div className="p-4 rounded-2xl bg-card border border-hairline flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-ink">Daily reminder</span>
              <span className="text-xs text-muted">Web Push notification · No spam</span>
            </div>
            <div className="flex items-center gap-1.5 bg-secondary-surface border border-hairline rounded-full px-3 py-1.5 text-xs font-medium text-ink">
              <Clock className="w-3.5 h-3.5 text-muted" />
              <select
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                aria-label="Daily reminder time"
                className="bg-transparent text-ink focus:outline-none cursor-pointer"
              >
                {REMINDER_TIMES.map((time) => (
                  <option key={time} value={time} className="bg-card text-ink">
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Resilience micro notice */}
          <div className="flex items-center gap-2 px-1 text-xs text-muted">
            <ShieldCheck className="w-4 h-4 shrink-0 text-muted" />
            <span>Milestone steps recalculate seamlessly without losing completed work.</span>
          </div>
        </main>

        {/* Bottom Fixed Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full md:max-w-[580px] border-t md:border md:rounded-2xl border-hairline bg-card/95 backdrop-blur-md p-4 pb-[env(safe-area-inset-bottom,16px)] md:bottom-6 shadow-sm">
          <PrimaryButton
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Building Week 1...' : 'Build Week 1 & start Day 1'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
