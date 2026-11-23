'use client';
/**
 * 1. Purpose: Compact clickable strip for prev and next task slots in the Today 3-Slot morph deck.
 * 2. Spec Ref: Stitch Screen 22, 3-Slot Fluid Morph Deck Contract.
 * 3. Called By: MorphDeck component.
 * 4. Calls: Standard img for proof thumbnail and Lucide/SVG checkmark.
 */

import React from 'react';
import type { ThreadTaskItem } from './types';

interface CompressedTaskSlotProps {
  task: ThreadTaskItem;
  isActiveHero: boolean;
  position: 'prev' | 'next';
  onClick: () => void;
}

function formatDoneTime(completedAt: string | null): string {
  if (!completedAt) return 'Done';
  const date = new Date(completedAt);
  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) {
    return `Done · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  return `Done · ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export function CompressedTaskSlot({
  task,
  isActiveHero,
  position,
  onClick,
}: Readonly<CompressedTaskSlotProps>) {
  const isDone = task.status === 'DONE';
  const photoProof = task.evidence?.find((e) => e.type === 'PHOTO');
  const noteProof = task.evidence?.find((e) => e.type === 'NOTE');
  const linkProof = task.evidence?.find((e) => e.type === 'LINK');

  const estimateMin = task.estimate_minutes || 45;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${position === 'prev' ? 'Previous' : 'Next'} task: ${task.title}`}
      className="w-full flex items-center justify-between gap-3 p-3.5 px-4 bg-card hover:bg-[var(--secondary-surface)] border border-hairline rounded-[20px] transition-colors cursor-pointer text-left shadow-none select-none"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Status Knot / Indicator */}
        {isDone ? (
          <div className="w-5 h-5 rounded-full bg-[#FFB020] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
            ✓
          </div>
        ) : isActiveHero ? (
          <div className="w-5 h-5 rounded-full border-2 border-ink bg-card flex items-center justify-center shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-ink" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full border border-hairline bg-card flex items-center justify-center shrink-0" />
        )}

        {/* Title and Meta Subtext */}
        <div className="flex flex-col min-w-0">
          <span className="text-[14px] font-semibold text-ink truncate leading-tight">
            {task.title}
          </span>
          <span className="text-[12px] text-muted truncate mt-0.5">
            {isDone
              ? formatDoneTime(task.completed_at)
              : isActiveHero
                ? 'Active now'
                : `Up next · ${estimateMin} min`}
          </span>
        </div>
      </div>

      {/* Right side Thumbnail or Peek Icon */}
      {isDone ? (
        <div className="shrink-0 flex items-center">
          {photoProof?.signed_url ? (
            <img
              src={photoProof.signed_url}
              alt="Proof thumbnail"
              className="w-9 h-9 rounded-lg object-cover border border-hairline"
            />
          ) : noteProof ? (
            <div className="w-9 h-9 rounded-lg bg-[var(--page)] border border-hairline flex items-center justify-center text-[12px] text-muted">
              📝
            </div>
          ) : linkProof ? (
            <div className="w-9 h-9 rounded-lg bg-[var(--page)] border border-hairline flex items-center justify-center text-[12px] text-muted">
              🔗
            </div>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-[var(--page)] border border-hairline flex items-center justify-center text-[11px] text-muted font-medium">
              Done
            </div>
          )}
        </div>
      ) : (
        <div className="text-muted text-[13px] shrink-0 font-medium pr-1">
          {position === 'prev' ? '↑' : '↓'}
        </div>
      )}
    </button>
  );
}
