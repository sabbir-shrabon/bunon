/**
 * 1. Purpose: Calm neutral safety and helpline screen for refused or distress prompts.
 * 2. Spec Ref: Screen 16 in Category B, Section 3 UI Design Guide.
 * 3. Called By: OnboardingWizard.
 * 4. Calls: PrimaryButton, SecondaryButton.
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';

interface SafetyScreenProps {
  safetyStatus: 'REFUSE_UNSAFE' | 'DISTURBING_HELP';
  refusalReason?: string;
  onEditGoal: () => void;
}

export function Screen16Safety({
  safetyStatus,
  refusalReason,
  onEditGoal,
}: SafetyScreenProps) {
  const router = useRouter();

  if (safetyStatus === 'DISTURBING_HELP') {
    return (
      <div className="flex flex-col min-h-screen bg-page text-ink justify-center px-4 py-6 md:py-10">
        <div className="w-full max-w-[580px] mx-auto flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Support and helpline resources
          </h1>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            If you or someone you know is going through a difficult time or experiencing distress,
            please reach out to trusted professionals or compassionate helpline services. You do not have
            to walk through it alone.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <div className="p-4 rounded-2xl bg-card border border-hairline flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-ink">Bangladesh National Helpline</p>
                <p className="text-xs text-muted mt-0.5">Emergency & Mental Health Support</p>
              </div>
              <a
                href="tel:999"
                className="px-3 py-1.5 rounded-full bg-secondary-surface border border-hairline text-xs font-semibold text-ink hover:border-ink"
              >
                Call 999 / 109
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-hairline flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-ink">International Crisis Hotline</p>
                <p className="text-xs text-muted mt-0.5">24/7 Confidential Crisis Support</p>
              </div>
              <a
                href="tel:988"
                className="px-3 py-1.5 rounded-full bg-secondary-surface border border-hairline text-xs font-semibold text-ink hover:border-ink"
              >
                Dial 988
              </a>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <PrimaryButton type="button" onClick={() => router.push('/today')} className="w-full">
              Back to home
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-page text-ink justify-center px-4 py-6 md:py-10">
      <div className="w-full max-w-[580px] mx-auto flex flex-col">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Bunon cannot build a plan for this goal
        </h1>
        <p className="text-sm text-muted mt-3 leading-relaxed">
          {refusalReason ||
            'To keep your journey constructive and safe, Bunon does not generate roadmaps for medical diagnoses, dangerous or illegal activities, or unsafe actions.'}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <PrimaryButton type="button" onClick={onEditGoal} className="w-full">
            Edit my goal
          </PrimaryButton>
          <SecondaryButton type="button" onClick={() => router.push('/today')} className="w-full">
            Back to home
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
