/**
 * 1. Purpose: Calm neutral error state when AI generation fails after retry.
 * 2. Spec Ref: Screen 21 in Category B, Section 3 UI Design Guide.
 * 3. Called By: OnboardingWizard.
 * 4. Calls: PrimaryButton, ThreadNode.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ThreadNode } from '@/components/ui/thread-node';

interface ErrorStateProps {
  errorMessage?: string;
  onRetry: () => void;
}

export function Screen21ErrorState({ errorMessage, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col min-h-screen bg-page text-ink justify-center px-4 py-6 md:py-10">
      <div className="w-full max-w-[580px] mx-auto flex flex-col items-center text-center">
        {/* Calm Thread Icon */}
        <div className="w-14 h-14 rounded-full bg-card border border-hairline flex items-center justify-center mb-6 shadow-none">
          <ThreadNode state="upcoming" />
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-ink">
          We could not build your plan just now
        </h1>
        <p className="text-sm text-muted mt-2 leading-relaxed max-w-sm">
          {errorMessage || 'Your answers are safely saved. You can try building your plan again without losing your roadmap allowance.'}
        </p>

        <div className="mt-8 w-full flex flex-col items-center gap-3">
          <PrimaryButton type="button" onClick={onRetry} className="w-full">
            Try again
          </PrimaryButton>

          <Link
            href="/today"
            className="text-xs text-muted hover:text-ink underline py-1 transition-colors cursor-pointer"
          >
            Go to Today
          </Link>
        </div>
      </div>
    </div>
  );
}
