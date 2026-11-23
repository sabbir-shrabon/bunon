/**
 * 1. Purpose: Expanded Hero Card view for completed (DONE) tasks within the Today 3-slot morph deck.
 * 2. Spec Ref: Stitch Screen 22, State 45/51, and 3-Slot Fluid Morph Deck Contract.
 * 3. Called By: MorphDeck component.
 * 4. Calls: Standard img for saved proof and collapsible step breakdown.
 */

'use client';

import React, { useState } from 'react';
import { safeExternalUrl } from '@/lib/security';
import type { HowToStepsData, SubStepItem } from '@/types/domain';
import type { ThreadTaskItem } from './types';

interface CompletedHeroCardProps {
  task: ThreadTaskItem;
  onOpenWhyThisTask?: () => void;
  onMarkNotDone: () => void;
}

function formatDoneDate(completedAt: string | null): string {
  if (!completedAt) return 'Done';
  const d = new Date(completedAt);
  return `Done · ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export function CompletedHeroCard({
  task,
  onOpenWhyThisTask,
  onMarkNotDone,
}: Readonly<CompletedHeroCardProps>) {
  const [isStepsOpen, setIsStepsOpen] = useState(false);

  const rawSteps = (task.how_to_steps_json as unknown as HowToStepsData) || { steps: [] };
  const steps: SubStepItem[] = Array.isArray(rawSteps.steps) ? rawSteps.steps : [];
  const totalSteps = steps.length;

  const photoProof = task.evidence?.find((e) => e.type === 'PHOTO');
  const noteProof = task.evidence?.find((e) => e.type === 'NOTE');
  const linkProof = task.evidence?.find((e) => e.type === 'LINK');
  const primaryEvidence = photoProof || noteProof || linkProof || task.evidence?.[0];

  const milestoneLabel = task.milestone_position ? ` · Milestone ${task.milestone_position}` : '';
  const dateLabel = `${formatDoneDate(task.completed_at)}${milestoneLabel}`;

  return (
    <section className="relative w-full rounded-[24px] border border-hairline bg-card p-6 shadow-none">
      {/* Top Metadata Row: Marigold Knot + Done Timestamp */}
      <div className="flex items-center justify-between mb-3 text-[12px] font-medium text-muted">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#FFB020] text-white flex items-center justify-center text-[9px] font-bold shrink-0">
            ✓
          </div>
          <span className="text-ink font-semibold">{dateLabel}</span>
        </div>

        {onOpenWhyThisTask && (
          <button
            type="button"
            aria-label="Task context and details"
            onClick={onOpenWhyThisTask}
            className="w-7 h-7 -mr-1.5 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-[var(--secondary-surface)] transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
        )}
      </div>

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
            <span>All {totalSteps} steps</span>
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
        <div className="w-full rounded-[14px] bg-[var(--page)] border border-hairline/60 p-3.5 mb-2 flex flex-col gap-2 animate-in fade-in duration-200">
          <div className="text-[12px] font-semibold text-muted mb-0.5">
            All {totalSteps} steps completed
          </div>
          <div className="flex flex-col gap-2 px-0.5">
            {steps.map((s) => (
              <div key={s.step_number} className="flex items-center justify-between gap-2.5 text-[13px]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-4 h-4 rounded-full bg-[#FFB020] text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                    ✓
                  </div>
                  <span className="line-through text-muted truncate">{s.text}</span>
                </div>
                <span className="text-[11px] font-medium text-muted shrink-0">
                  {s.minutes || 15}m
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thread Connector Line into Saved Proof */}
      <div className="flex items-center pl-[33px] my-1.5">
        <div className="w-[1.5px] h-4 bg-hairline" />
      </div>

      {/* Saved Proof Preview (Beat 2) */}
      <div className="flex flex-col gap-2 p-3.5 bg-[var(--page)] rounded-xl border border-hairline/40 transition-colors">
        <div className="text-[12px] font-medium text-muted">
          Saved proof
        </div>

        {photoProof?.signed_url && (
          <div className="w-full overflow-hidden rounded-2xl border border-hairline bg-card">
            <img
              src={photoProof.signed_url}
              alt={photoProof.caption_note || task.title || 'Task proof'}
              className="w-full max-h-[420px] object-cover rounded-2xl border border-hairline"
            />
          </div>
        )}

        {primaryEvidence?.caption_note && (
          <p className="text-[14px] text-ink leading-relaxed pt-1">
            {primaryEvidence.caption_note}
          </p>
        )}

        {linkProof?.external_url && safeExternalUrl(linkProof.external_url) && (
          <a
            href={safeExternalUrl(linkProof.external_url)!}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-ink underline truncate hover:opacity-80 transition-opacity"
          >
            {linkProof.external_url}
          </a>
        )}

        {!photoProof && !linkProof && !primaryEvidence?.caption_note && (
          <div className="text-[13px] text-muted italic">
            Proof confirmed
          </div>
        )}
      </div>

      {/* Card Footer: Quiet Centered 'Mark as not done' Link */}
      <div className="pt-5 flex justify-center">
        <button
          type="button"
          onClick={onMarkNotDone}
          className="text-[13px] font-normal text-muted hover:text-ink transition-colors cursor-pointer"
        >
          Mark as not done
        </button>
      </div>
    </section>
  );
}
