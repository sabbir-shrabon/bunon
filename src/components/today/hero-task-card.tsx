/**
 * 1. Purpose: Breathable Hero Task Card with collapsible step guide attached to main title and 2-beat thread.
 * 2. Spec Ref: Stitch today_cleanest_2_beat_thread Screen 22, State 33, and Sheet 37b.
 * 3. Called By: TodayView / MorphDeck component.
 * 4. Calls: BeatOneDo, BeatTwoProve, and sheet action callbacks.
 */

'use client';

import { useState } from 'react';
import type { TaskRow, MilestoneRow } from '@/types/db/goal-tables';
import type { SubStepItem, StepSlicerResult } from '@/types/domain';
import { BeatOneDo } from './beat-one-do';
import { BeatTwoProve } from './beat-two-prove';

interface HeroTaskCardProps {
  task: TaskRow;
  steps: SubStepItem[];
  milestone: MilestoneRow | null;
  adaptiveSlice: StepSlicerResult | null;
  planStyle: string;
  onOpenWhyThisTask: () => void;
  onOpenStuckSheet: () => void;
  onToggleSubstep: (stepNumber: number, done: boolean) => Promise<void>;
  onToggle10Min: (active: boolean) => Promise<void>;
  onUndoAdjustment: () => Promise<void>;
  onCameraClick: () => void;
  onNoteLinkClick: () => void;
}

export function HeroTaskCard({
  task,
  steps,
  milestone,
  adaptiveSlice,
  planStyle,
  onOpenWhyThisTask,
  onOpenStuckSheet,
  onToggleSubstep,
  onToggle10Min,
  onUndoAdjustment,
  onCameraClick,
  onNoteLinkClick,
}: Readonly<HeroTaskCardProps>) {
  const [isStepsOpen, setIsStepsOpen] = useState(false);
  const milestonePos = milestone?.position || 1;
  const estimateMin = task.estimate_minutes || 45;
  const totalSteps = steps?.length || 0;

  return (
    <section className="relative w-full rounded-[24px] border border-hairline bg-card p-6 shadow-none">
      {/* Top Metadata Row */}
      <div className="flex items-center justify-between mb-3 text-[12px] font-medium text-muted">
        <span>{estimateMin} min · Milestone {milestonePos}</span>
        <button
          type="button"
          aria-label="Task context and why this task"
          onClick={onOpenWhyThisTask}
          className="w-7 h-7 -mr-1.5 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-[var(--secondary-surface)] transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </button>
      </div>

      {/* State 33: 10-Minute Version / Fast Zero-Prep Active Banner */}
      {task.used_10m_version && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-[var(--page)] border border-hairline/60 px-3.5 py-2.5">
          <div className="flex items-center gap-2 text-[13px] font-medium text-ink">
            <span className="w-2 h-2 rounded-full bg-[var(--marigold)]" />
            <span>10-min version active: {task.min_version_10m}</span>
          </div>
          <button
            type="button"
            onClick={() => onToggle10Min(false)}
            className="text-[12px] font-medium text-muted hover:text-ink transition-colors cursor-pointer"
          >
            Back to full task
          </button>
        </div>
      )}

      {/* Reversible Undo Chip for Pipeline 4 Adjustments */}
      {task.original_task_json && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-[var(--page)] border border-hairline/60 px-3.5 py-2">
          <span className="text-[12px] text-muted truncate">
            Adjusted: {task.adaptation_reason || 'Paced lighter'}
          </span>
          <button
            type="button"
            onClick={onUndoAdjustment}
            className="text-[12px] font-semibold text-ink underline-offset-2 hover:underline ml-2 cursor-pointer shrink-0"
          >
            Undo
          </button>
        </div>
      )}

      {/* Main Task Title Row with Attached Steps Dropdown */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h1 className="text-[24px] font-semibold leading-[30px] tracking-[-0.015em] text-ink">
          {task.title}
        </h1>
        {totalSteps > 0 && (
          <button
            type="button"
            aria-expanded={isStepsOpen}
            onClick={() => setIsStepsOpen(!isStepsOpen)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium text-muted hover:text-ink bg-[var(--page)] border border-hairline hover:border-hairline/80 transition-colors shrink-0 mt-0.5 cursor-pointer select-none"
          >
            <span>{totalSteps} steps</span>
            <svg
              className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${isStepsOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}
      </div>

      {/* Unified Collapsible Step-by-Step Guide directly under Main Task Title */}
      {isStepsOpen && totalSteps > 0 && (
        <BeatOneDo
          steps={steps}
          adaptiveSlice={adaptiveSlice}
          planStyle={planStyle}
          onToggleSubstep={onToggleSubstep}
          onProofClick={onCameraClick}
        />
      )}

      {/* Thread Connector Line into Beat 2 (Prove) */}
      <div className="flex items-center pl-[33px] my-1.5">
        <div className="w-[1.5px] h-4 bg-hairline" />
      </div>

      {/* Beat 2 (Prove to finish) */}
      <BeatTwoProve
        doneMeans={task.done_means}
        onCameraClick={onCameraClick}
        onNoteLinkClick={onNoteLinkClick}
      />

      {/* Card Footer: Single Quiet Link */}
      <div className="pt-5 flex justify-center">
        <button
          type="button"
          onClick={onOpenStuckSheet}
          className="text-[13px] font-normal text-muted hover:text-ink transition-colors cursor-pointer"
        >
          Stuck or short on time?
        </button>
      </div>
    </section>
  );
}
