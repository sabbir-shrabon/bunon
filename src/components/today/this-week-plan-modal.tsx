/**
 * 1. Purpose: Read-only modal/page for Screen 36 (This week's plan) showing current week tasks & sub-steps.
 * 2. Spec Ref: Stitch Screen 36 (This week's plan).
 * 3. Called By: TodayView when tapping "See this week's plan" from New Week Card.
 * 4. Calls: BottomSheet and pure UI markup.
 */

'use client';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import type { TaskRow, MilestoneRow } from '@/types/db/goal-tables';
import type { HowToStepsData } from '@/types/domain';

interface ThisWeekPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekNumber: number;
  milestone: MilestoneRow | null;
  tasks: TaskRow[];
  onSelectTask?: (taskId: string) => void;
}

export function ThisWeekPlanModal({
  isOpen,
  onClose,
  weekNumber,
  milestone,
  tasks,
  onSelectTask,
}: Readonly<ThisWeekPlanModalProps>) {
  if (!isOpen) return null;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Week ${weekNumber} Plan`}>
      <div className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto py-1">
        {/* Milestone Context */}
        {milestone && (
          <div className="rounded-xl bg-[var(--page)] p-3 border border-hairline/60">
            <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Milestone {milestone.position}
            </div>
            <div className="text-[14px] font-semibold text-ink mt-0.5">
              {milestone.title}
            </div>
            <p className="text-[12px] text-muted mt-0.5">{milestone.expected_result}</p>
          </div>
        )}

        {/* Task List */}
        <div className="flex flex-col gap-3">
          {tasks.map((task) => {
            const isDone = task.status === 'DONE' || task.status === 'SKIPPED_BASIC';
            const rawSteps = (task.how_to_steps_json as unknown as HowToStepsData) || { steps: [] };
            const steps = Array.isArray(rawSteps.steps) ? rawSteps.steps : [];

            return (
              <div
                key={task.id}
                onClick={() => {
                  onSelectTask?.(task.id);
                  onClose();
                }}
                className="rounded-xl border border-hairline/60 bg-card p-3.5 hover:bg-[var(--page)] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                        isDone
                          ? 'bg-[var(--marigold)] text-white'
                          : 'border border-[var(--inactive)]'
                      }`}
                    >
                      {isDone && '✓'}
                    </span>
                    <span
                      className={`text-[13px] font-semibold ${
                        isDone ? 'line-through text-muted' : 'text-ink'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted shrink-0">
                    {task.estimate_minutes}m
                  </span>
                </div>

                {/* Sub-steps preview */}
                {steps.length > 0 && (
                  <div className="pl-5 flex flex-col gap-1 pt-1 border-t border-hairline/40">
                    {steps.map((s) => (
                      <div key={s.step_number} className="flex items-center gap-2 text-[12px]">
                        <span className={`w-1.5 h-1.5 rounded-full ${s.done ? 'bg-[var(--marigold)]' : 'bg-hairline'}`} />
                        <span className={s.done ? 'line-through text-muted' : 'text-muted'}>
                          {s.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
}
