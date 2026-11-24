/**
 * 1. Purpose: Screen 10 (Q1 Goal & Why) with starter chips, StepHeader, and centered desktop layout.
 * 2. Spec Ref: Stitch onboarding_q1_goal_and_why & Screen 10 in UI Design Guide.
 * 3. Called By: OnboardingWizard.
 * 4. Calls: PrimaryButton, StepHeader.
 */

'use client';

import React, { useState } from 'react';
import { PrimaryButton } from '@/components/ui/primary-button';
import { StepHeader } from '@/components/onboarding/step-header';

const STARTER_CHIPS = [
  'Build my own venture',
  'Advance my career',
  'Feel healthier & stronger',
];

export function Screen10GoalWhy({
  initialGoal,
  initialWhy,
  onContinue,
  onBack,
}: Readonly<{
  initialGoal: string;
  initialWhy: string;
  onContinue: (goal: string, why: string) => void;
  onBack?: () => void;
}>) {
  const [goal, setGoal] = useState(initialGoal);
  const [why, setWhy] = useState(initialWhy);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) {
      setError('Please state your goal.');
      return;
    }
    if (!why.trim()) {
      setError('Please tell us why it matters to you.');
      return;
    }
    onContinue(goal.trim(), why.trim());
  };

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col">
      <div className="w-full max-w-[580px] mx-auto px-4 py-4 md:py-8 flex flex-col flex-1 pb-32">
        <StepHeader part={1} onBack={onBack} />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          {/* Main Focus Card */}
          <div className="rounded-[20px] border border-hairline bg-card p-6 shadow-none flex flex-col">
            {/* Thread Emblem */}
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-4 rounded-full bg-card flex items-center justify-center border border-ink">
                <div className="h-1.5 w-1.5 rounded-full bg-ink" />
              </div>
              <div className="h-[1.5px] w-6 bg-hairline" />
              <span className="text-[11px] font-medium text-muted uppercase tracking-wider">
                Intent Milestone
              </span>
            </div>

            <h1 className="text-[20px] font-semibold leading-[26px] tracking-tight text-ink">
              What is your goal, and why does it matter to you?
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              We ask this so every daily task and your final Journey Card connect to your real reason.
            </p>

            {/* Input 1: Goal */}
            <div className="mt-6 flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="goal-input" className="text-[12px] font-medium text-ink uppercase tracking-wider">
                  What is your goal?
                </label>
                <span className="text-[11px] text-muted">Required</span>
              </div>
              <input
                id="goal-input"
                type="text"
                required
                maxLength={150}
                value={goal}
                onChange={(e) => {
                  setGoal(e.target.value);
                  setError('');
                }}
                placeholder="e.g., Launch my first paid SaaS MVP"
                className="h-12 w-full rounded-xl border border-hairline bg-card px-4 text-[15px] text-ink placeholder:text-inactive focus:outline-none focus:border-ink transition-colors"
              />
            </div>

            {/* Input 2: Why */}
            <div className="mt-5 flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="why-input" className="text-[12px] font-medium text-ink uppercase tracking-wider">
                  Why does it matter to you?
                </label>
                <span className="text-[11px] text-muted">Required</span>
              </div>
              <textarea
                id="why-input"
                required
                maxLength={350}
                rows={3}
                value={why}
                onChange={(e) => {
                  setWhy(e.target.value);
                  setError('');
                }}
                placeholder="To prove to myself I can build independent freedom and handle end-to-end product delivery."
                className="w-full rounded-xl border border-hairline bg-card p-3 text-[15px] text-ink placeholder:text-inactive focus:outline-none focus:border-ink resize-none transition-colors"
              />
            </div>

            {/* Quick-tap suggestion chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              {STARTER_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setWhy((prev) => (prev ? `${prev}. ${chip}` : chip));
                    setError('');
                  }}
                  className="rounded-full bg-secondary-surface px-3 py-1.5 text-[12px] font-medium text-ink border border-hairline hover:border-ink transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {error && <p className="mt-4 text-[13px] text-[#B42318]">{error}</p>}
          </div>

          {/* Craftsmanship Note */}
          <div className="rounded-[20px] bg-secondary-surface border border-hairline p-4 flex items-start gap-3">
            <span className="text-muted mt-0.5 text-base">✦</span>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-ink">Unbroken Clarity</span>
              <p className="text-[12px] text-muted mt-0.5 leading-relaxed">
                Bunon forms a continuous timeline from this statement. You can recalibrate this at any milestone.
              </p>
            </div>
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
