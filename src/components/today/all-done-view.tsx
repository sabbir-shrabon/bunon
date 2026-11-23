/**
 * 1. Purpose: All done / Week queue done celebration state (State 23).
 * 2. Spec Ref: Stitch State 23 & Category C Screen 23.
 * 3. Called By: TodayView when all tasks for today or current week are complete.
 * 4. Calls: PrimaryButton and day note trigger.
 */

'use client';

import { PrimaryButton } from '@/components/ui/primary-button';

interface AllDoneViewProps {
  isWeekQueueDone: boolean;
  weekNumber: number;
  onOpenDayNote: () => void;
  onAdvanceWeek?: () => void;
  onStartTomorrowEarly?: () => void;
  hasUpcomingTasksThisWeek?: boolean;
}

export function AllDoneView({
  isWeekQueueDone,
  weekNumber,
  onOpenDayNote,
  onAdvanceWeek,
  onStartTomorrowEarly,
  hasUpcomingTasksThisWeek = false,
}: Readonly<AllDoneViewProps>) {
  return (
    <section className="w-full rounded-[24px] border border-hairline bg-card p-8 text-center flex flex-col items-center">
      {/* Marigold Finished Knot Seal */}
      <div className="w-12 h-12 rounded-full bg-[var(--marigold)] text-white flex items-center justify-center text-[22px] mb-4">
        ✓
      </div>

      <h1 className="text-[22px] font-semibold text-ink leading-snug mb-2">
        {isWeekQueueDone
          ? `That is Week ${weekNumber}'s work done`
          : 'That is today done'}
      </h1>

      <p className="text-[14px] text-muted mb-6 max-w-xs leading-relaxed">
        {isWeekQueueDone
          ? 'Every deliverable for this week has been completed and proved. You held your pace.'
          : 'Rest up or take a walk. Your progress has been saved.'}
      </p>

      {isWeekQueueDone && onAdvanceWeek && (
        <div className="w-full max-w-xs mb-3">
          <PrimaryButton onClick={onAdvanceWeek}>
            Review Week {weekNumber} &amp; unlock Week {weekNumber + 1}
          </PrimaryButton>
        </div>
      )}

      {hasUpcomingTasksThisWeek && onStartTomorrowEarly && (
        <button
          type="button"
          onClick={onStartTomorrowEarly}
          className="text-[13px] font-semibold text-ink underline-offset-2 hover:underline mb-3 cursor-pointer"
        >
          Start tomorrow&apos;s task early
        </button>
      )}

      <button
        type="button"
        onClick={onOpenDayNote}
        className="text-[13px] font-medium text-muted hover:text-ink transition-colors cursor-pointer"
      >
        + Add a day note
      </button>
    </section>
  );
}
