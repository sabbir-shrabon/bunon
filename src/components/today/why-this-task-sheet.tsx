/**
 * 1. Purpose: Task context and 'Why this task' bottom sheet (Sheet 22b) with 3-knot vertical thread.
 * 2. Spec Ref: Stitch Sheet 22b & Category C Screen 22b.
 * 3. Called By: HeroTaskCard top-right info icon.
 * 4. Calls: BottomSheet, PrimaryButton, and useRouter.
 */

'use client';

import { useRouter } from 'next/navigation';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import type { TaskRow, MilestoneRow, GoalRow } from '@/types/db/goal-tables';

interface WhyThisTaskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskRow;
  milestone: MilestoneRow | null;
  goal: GoalRow;
  streakText: string | null;
  onNotUsefulClick: () => void;
}

export function WhyThisTaskSheet({
  isOpen,
  onClose,
  task,
  milestone,
  goal,
  streakText,
  onNotUsefulClick,
}: Readonly<WhyThisTaskSheetProps>) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Why this task">
      <div className="flex flex-col gap-5 pt-1 pb-2">
        {/* 1. Context & Pace Banner */}
        <div className="flex flex-col gap-1.5 rounded-xl bg-[var(--page)] p-3.5 border border-hairline/60">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink">
              On track for Milestone {milestone?.position || 1}
            </span>
            {streakText && (
              <span className="rounded-full bg-[var(--secondary-surface)] px-2.5 py-0.5 text-[11px] font-medium text-ink">
                {streakText}
              </span>
            )}
          </div>
          {goal.today_context_line && (
            <p className="text-[12px] text-muted leading-relaxed">
              {goal.today_context_line}
            </p>
          )}
        </div>

        {/* 2. 3-Knot Vertical Thread ('Why This Task' Chain) */}
        <div className="relative flex flex-col gap-4 pl-6">
          <div className="absolute left-[7px] top-2 bottom-3 w-[1.5px] bg-hairline" />

          {/* Knot 1: Today's Task */}
          <div className="relative">
            <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-ink" />
            <div className="text-[12px] font-medium text-muted">Today's task</div>
            <div className="text-[14px] font-semibold text-ink">{task.title}</div>
            <p className="text-[12px] text-muted mt-0.5">{task.why_it_matters}</p>
          </div>

          {/* Knot 2: Milestone */}
          <div className="relative">
            <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 border-ink bg-card" />
            <div className="text-[12px] font-medium text-muted">Milestone {milestone?.position || 1}</div>
            <div className="text-[14px] font-semibold text-ink">{milestone?.title || 'Core Foundation'}</div>
            <p className="text-[12px] text-muted mt-0.5">{milestone?.expected_result}</p>
          </div>

          {/* Knot 3: Goal */}
          <div className="relative">
            <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-[var(--marigold)]" />
            <div className="text-[12px] font-medium text-muted">Your goal</div>
            <div className="text-[14px] font-semibold text-ink">{goal.title}</div>
            <p className="text-[12px] text-muted mt-0.5 italic">"{goal.why}"</p>
          </div>
        </div>

        {/* 3. 'Based on what Bunon knows' Box */}
        <div className="rounded-xl border border-hairline/60 bg-card p-3.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted">Based on what Bunon knows</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push('/what-bunon-knows');
              }}
              className="text-[12px] font-medium text-ink underline-offset-2 hover:underline cursor-pointer"
            >
              Edit ›
            </button>
          </div>
          <p className="text-[12px] text-muted">
            Shaped by your weekly schedule and past adjustments.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <PrimaryButton onClick={onClose}>Got it, back to task</PrimaryButton>
          <button
            type="button"
            onClick={() => {
              onClose();
              onNotUsefulClick();
            }}
            className="text-[12px] text-muted hover:text-ink transition-colors cursor-pointer"
          >
            This task doesn't feel useful
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
