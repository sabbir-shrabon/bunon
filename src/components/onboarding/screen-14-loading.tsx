/**
 * 1. Purpose: Calm neutral loading screen between wizard stages with AI transparency notice.
 * 2. Spec Ref: Screen 14 in Category B, Section 3 UI Design Guide.
 * 3. Called By: OnboardingWizard.
 * 4. Calls: ThreadNode SVG indicator.
 */

'use client';

import React from 'react';
import { ThreadNode } from '@/components/ui/thread-node';

interface LoadingScreenProps {
  goalTitle: string;
  stage: 'followups' | 'roadmap' | 'locking' | 'context_ingest';
}

export function Screen14Loading({ goalTitle, stage }: LoadingScreenProps) {
  let title = `Reading your answers about ${goalTitle || 'your goal'}...`;
  let subtitle = 'Identifying key milestones and weekly pacing tailored to your rhythm.';

  if (stage === 'context_ingest') {
    title = 'Reading your plan & outline...';
    subtitle = 'Extracting your milestones, baseline, and pacing without storing your file.';
  } else if (stage === 'roadmap') {
    title = `Building your milestone roadmap for ${goalTitle || 'your goal'}...`;
    subtitle = 'Checking your working days, estimated hours, and required deliverables.';
  } else if (stage === 'locking') {
    title = 'Locking your plan & building Week 1...';
    subtitle = 'Setting up your first day’s small, clear action steps.';
  }

  return (
    <div className="flex flex-col min-h-screen bg-page text-ink items-center justify-center px-4 py-6 md:py-10">
      <div className="w-full max-w-[580px] mx-auto flex flex-col items-center text-center">
        {/* Animated Thread Knot Icon */}
        <div className="relative w-16 h-16 flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-hairline animate-ping opacity-40" />
          <div className="w-12 h-12 rounded-full bg-card border border-hairline flex items-center justify-center shadow-none">
            <ThreadNode state="current" />
          </div>
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        <p className="text-sm text-muted mt-2 max-w-sm">
          {subtitle}
        </p>

        {/* Calm AI Transparency Notice */}
        <div className="mt-12 p-3.5 rounded-2xl bg-card border border-hairline text-xs text-muted max-w-sm">
          Your plan is AI-made around your answers, and is not medical or financial advice.
        </div>
      </div>
    </div>
  );
}
