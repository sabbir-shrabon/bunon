/**
 * 1. Purpose: Screen 10a (Onboarding Entry Path Chooser) for selecting File/Notes vs Quick Questions path.
 * 2. Spec Ref: Stitch UI Design Guide Category B Screen 10a & Master Build Plan v2.5.
 * 3. Called By: OnboardingWizard.
 * 4. Calls: StepHeader, Lucide icons (FileText, Sparkles, ArrowRight).
 */

'use client';

import React from 'react';
import { FileText, Sparkles, ArrowRight } from 'lucide-react';
import { StepHeader } from '@/components/onboarding/step-header';
import type { OnboardingEntryPath } from '@/components/onboarding/types';

interface Screen10aChoosePathProps {
  onSelectPath: (path: OnboardingEntryPath) => void;
}

export function Screen10aChoosePath({ onSelectPath }: Readonly<Screen10aChoosePathProps>) {
  return (
    <div className="min-h-screen bg-page text-ink flex flex-col">
      <div className="w-full max-w-[580px] mx-auto px-4 py-4 md:py-8 flex flex-col flex-1 pb-20">
        <StepHeader part={1} />

        <main className="flex flex-col gap-5 mt-6">
          {/* Header Title Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-4 w-4 rounded-full bg-card flex items-center justify-center border border-ink">
                <div className="h-1.5 w-1.5 rounded-full bg-ink" />
              </div>
              <div className="h-[1.5px] w-6 bg-hairline" />
              <span className="text-[11px] font-medium text-muted uppercase tracking-wider">
                Starting Point
              </span>
            </div>

            <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-ink">
              How would you like to start?
            </h1>
            <p className="text-[14px] leading-relaxed text-muted">
              Your plan, your way — bring your own notes or answer a few quick questions.
            </p>
          </div>

          {/* Path Option Cards */}
          <div className="flex flex-col gap-3.5 mt-2">
            {/* Option 1: File / Notes (Recommended User-Owned Path) */}
            <button
              type="button"
              onClick={() => onSelectPath('FILE_NOTES')}
              className="group text-left p-5 rounded-[20px] border border-hairline bg-card hover:border-ink/60 dark:hover:border-white/60 transition-all duration-150 cursor-pointer shadow-none flex items-start gap-4 focus:outline-none focus:ring-2 focus:ring-ink"
            >
              <div className="h-11 w-11 rounded-full bg-secondary-surface flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-ink">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-[16px] font-semibold text-ink group-hover:text-ink">
                    I already have a file or notes
                  </h2>
                  <ArrowRight className="w-4 h-4 text-muted group-hover:text-ink group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
                <p className="text-[13px] leading-relaxed text-muted">
                  Drop a syllabus, outline, doc, or paste notes — turn your own plan into finishable steps.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary-surface text-ink">
                    PDF, DOCX, TXT, MD, or Photos
                  </span>
                  <span className="text-[11px] text-muted">· Fast track</span>
                </div>
              </div>
            </button>

            {/* Option 2: Quick Questions (Guided Path) */}
            <button
              type="button"
              onClick={() => onSelectPath('QUESTIONS')}
              className="group text-left p-5 rounded-[20px] border border-hairline bg-card hover:border-ink/60 dark:hover:border-white/60 transition-all duration-150 cursor-pointer shadow-none flex items-start gap-4 focus:outline-none focus:ring-2 focus:ring-ink"
            >
              <div className="h-11 w-11 rounded-full bg-secondary-surface flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-ink">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-[16px] font-semibold text-ink group-hover:text-ink">
                    Guide me with quick questions
                  </h2>
                  <ArrowRight className="w-4 h-4 text-muted group-hover:text-ink group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
                <p className="text-[13px] leading-relaxed text-muted">
                  Answer 5 quick questions and build your roadmap together.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary-surface text-ink">
                    ~2 minutes
                  </span>
                  <span className="text-[11px] text-muted">· Step-by-step guidance</span>
                </div>
              </div>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
