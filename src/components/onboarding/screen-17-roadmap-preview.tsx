/**
 * 1. Purpose: Screen 17 Roadmap Preview with Plan A/B toggle and vertical Thread spine.
 * 2. Spec Ref: Screen 17 in Category B, Section 3 UI Design Guide.
 * 3. Called By: OnboardingWizard.
 * 4. Calls: PrimaryButton, Sheet19Feasibility, SheetAdjustRoadmap.
 */

'use client';

import React, { useState } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Sheet19Feasibility } from '@/components/onboarding/sheet-19-feasibility';
import { SheetAdjustRoadmap } from '@/components/onboarding/sheet-adjust-roadmap';
import { UnderstoodFactsCard, type EditableMemoryFact } from '@/components/onboarding/understood-facts-card';
import type { Pipeline2Output } from '@/types/ai-schemas';

interface RoadmapPreviewProps {
  goalTitle: string;
  deadlineDate: string;
  totalWeeks: number;
  availableHours: number;
  currentRoadmap: Pipeline2Output;
  previousRoadmap: Pipeline2Output | null;
  activePlan: 'A' | 'B';
  confirmedMemoryFacts?: EditableMemoryFact[];
  onChangeConfirmedMemoryFacts?: (facts: EditableMemoryFact[]) => void;
  onSwitchPlan: (plan: 'A' | 'B') => void;
  onRegenerate: (reason: string, notes?: string) => Promise<void>;
  onLockRoadmap: () => void;
  onBack: () => void;
}

export function Screen17RoadmapPreview({
  goalTitle,
  deadlineDate,
  totalWeeks,
  availableHours,
  currentRoadmap,
  previousRoadmap,
  activePlan,
  confirmedMemoryFacts = [],
  onChangeConfirmedMemoryFacts = () => {},
  onSwitchPlan,
  onRegenerate,
  onLockRoadmap,
  onBack,
}: RoadmapPreviewProps) {
  const [showRegenSheet, setShowRegenSheet] = useState(false);
  const [showFeasibilitySheet, setShowFeasibilitySheet] = useState(false);

  const totalRequiredHours = currentRoadmap.milestones.reduce(
    (acc, m) => acc + m.estimated_hours,
    0
  );
  const isOver85Percent = availableHours > 0 && totalRequiredHours > 0.85 * availableHours;

  const handleStartLock = () => {
    if (isOver85Percent) {
      setShowFeasibilitySheet(true);
    } else {
      onLockRoadmap();
    }
  };

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col">
      <header className="sticky top-0 z-20 bg-card/90 backdrop-blur-md border-b border-hairline px-4 h-14">
        <div className="w-full max-w-[640px] mx-auto h-full flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-secondary-surface text-ink transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-semibold truncate px-2 text-ink">{goalTitle}</h1>
          <div className="w-8" />
        </div>
      </header>

      <main className="flex-1 w-full max-w-[640px] mx-auto px-4 py-4 md:py-8 pb-32 flex flex-col gap-5">
        {previousRoadmap && (
          <div className="flex items-center justify-center gap-2 p-1 bg-card border border-hairline rounded-full w-fit mx-auto">
            <button
              type="button"
              onClick={() => onSwitchPlan('A')}
              className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors cursor-pointer ${
                activePlan === 'A'
                  ? 'bg-ink text-page'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Plan A (Original)
            </button>
            <button
              type="button"
              onClick={() => onSwitchPlan('B')}
              className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors cursor-pointer ${
                activePlan === 'B'
                  ? 'bg-ink text-page'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Plan B (Updated)
            </button>
          </div>
        )}

        {isOver85Percent && (
          <div className="p-3.5 rounded-2xl bg-card border border-amber-500/60 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-xs text-ink leading-relaxed">
              <span className="font-semibold">Tight pacing notice:</span> This plan needs ~
              {Math.round(totalRequiredHours)}h and you have ~{Math.round(availableHours)}h.
              Consider extending your deadline for a calmer pace.
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Target: {deadlineDate}</span>
            <span>{totalWeeks} weeks · ~{Math.round(totalRequiredHours)} hours</span>
          </div>

          <UnderstoodFactsCard
            facts={confirmedMemoryFacts}
            onChangeFacts={onChangeConfirmedMemoryFacts}
          />
        </div>

        <div className="relative flex flex-col gap-4 pl-6 before:content-[''] before:absolute before:left-2.5 before:top-4 before:bottom-4 before:w-[1.5px] before:bg-hairline">
          {currentRoadmap.milestones.map((milestone) => (
            <div key={milestone.position} className="relative flex flex-col">
              <div className="absolute -left-6 top-3.5 w-3 h-3 rounded-full bg-card border-2 border-ink" />
              <div className="p-4 rounded-2xl bg-card border border-hairline flex flex-col gap-1.5 shadow-none">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="font-medium text-ink">
                    Milestone {milestone.position}
                  </span>
                  <span>~{milestone.estimated_hours}h</span>
                </div>
                <h2 className="text-sm font-semibold text-ink">
                  {milestone.title}
                </h2>
                <p className="text-xs text-muted leading-relaxed">
                  {milestone.expected_result}
                </p>
                {milestone.target_metric_value && (
                  <div className="mt-1 text-[11px] text-ink bg-secondary-surface px-2.5 py-1 rounded-lg w-fit">
                    Target: {milestone.target_metric_value} {milestone.target_metric_unit || ''}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setShowRegenSheet(true)}
            className="text-xs text-muted hover:text-ink underline py-1 transition-colors cursor-pointer"
          >
            This doesn't fit me
          </button>
        </div>
      </main>

      {/* Bottom Fixed Action Bar constrained to max-w-[640px] */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full md:max-w-[640px] border-t md:border md:rounded-2xl border-hairline bg-card/95 backdrop-blur-md p-4 pb-[env(safe-area-inset-bottom,16px)] md:bottom-6 shadow-sm">
        <PrimaryButton type="button" onClick={handleStartLock} className="w-full">
          Lock my roadmap
        </PrimaryButton>
      </div>

      <SheetAdjustRoadmap
        isOpen={showRegenSheet}
        onClose={() => setShowRegenSheet(false)}
        onRegenerate={onRegenerate}
      />

      <Sheet19Feasibility
        isOpen={showFeasibilitySheet}
        onClose={() => setShowFeasibilitySheet(false)}
        requiredHours={totalRequiredHours}
        availableHours={availableHours}
        recommendedDeadline="Extended date"
        onAcceptRecommendation={() => {
          setShowFeasibilitySheet(false);
          onLockRoadmap();
        }}
        onKeepCurrent={() => {
          setShowFeasibilitySheet(false);
          onLockRoadmap();
        }}
      />
    </div>
  );
}
