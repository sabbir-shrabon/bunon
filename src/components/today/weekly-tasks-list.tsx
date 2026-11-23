/**
 * 1. Purpose: Accordion component displaying remaining weekly tasks and 1-tap +1 quota logging.
 * 2. Spec Ref: Stitch today_cleanest_2_beat_thread & today_inline_sub_steps_expanded Screen 22.
 * 3. Called By: TodayView component below the Hero Task Card.
 * 4. Calls: Pure UI markup and onLogQuota callback.
 */

'use client';

import { useState } from 'react';
import type { TaskRow } from '@/types/db/goal-tables';

interface WeeklyTasksListProps {
  tasks: TaskRow[];
  onLogQuota: (taskId: string) => Promise<void>;
  onSelectTask?: (taskId: string) => void;
}

export function WeeklyTasksList({
  tasks,
  onLogQuota,
  onSelectTask,
}: Readonly<WeeklyTasksListProps>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loggingId, setLoggingId] = useState<string | null>(null);

  if (!tasks || tasks.length === 0) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const doneCount = tasks.filter((t) => t.status === 'DONE' || t.status === 'SKIPPED_BASIC').length;
  const pendingCount = tasks.filter((t) => t.status === 'PENDING').length;

  const handleQuota = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoggingId(taskId);
    try {
      await onLogQuota(taskId);
    } finally {
      setLoggingId(null);
    }
  };

  return (
    <div className="w-full flex flex-col items-center pt-2">
      {/* Accordion Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-muted hover:text-ink transition-colors font-medium text-[13px] py-1 cursor-pointer"
      >
        <span>
          {doneCount > 0
            ? `This week · ${doneCount} done${pendingCount > 0 ? `, ${pendingCount} up next` : ''}`
            : `Up next this week · ${tasks.length} more`}
        </span>
        <svg
          className={`w-4 h-4 fill-none stroke-current stroke-2 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          viewBox="0 0 24 24"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded Task Cards */}
      {isExpanded && (
        <div className="w-full flex flex-col gap-2.5 mt-3">
          {tasks.map((task) => {
            const isDone = task.status === 'DONE' || task.status === 'SKIPPED_BASIC';
            const isQuotaTask = task.task_type === 'DAILY_CORE' || task.task_type === 'WEEKLY_QUOTA';
            const alreadyLoggedToday = task.last_quota_logged_date === todayStr;

            return (
              <article
                key={task.id}
                onClick={() => onSelectTask?.(task.id)}
                className="w-full rounded-[20px] border border-hairline/60 bg-card p-4 flex items-center justify-between shadow-none hover:bg-[var(--page)] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {/* Thread Node */}
                  <div
                    className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center ${
                      isDone
                        ? 'bg-[var(--marigold)] text-white text-[10px]'
                        : 'border-2 border-hairline bg-card'
                    }`}
                    style={isDone ? { backgroundColor: '#FFB020' } : undefined}
                  >
                    {isDone && '✓'}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span
                      className={`text-[13px] font-medium truncate ${
                        isDone ? 'line-through text-muted' : 'text-ink'
                      }`}
                    >
                      {task.title}
                    </span>
                    {isQuotaTask && (
                      <span className="text-[11px] text-muted">
                        {task.completed_count || 0} of {task.target_count} logged
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isQuotaTask && !isDone && (
                    <button
                      type="button"
                      disabled={alreadyLoggedToday || loggingId === task.id}
                      onClick={(e) => handleQuota(task.id, e)}
                      className={`text-[12px] font-medium px-3 py-1 rounded-full transition-colors cursor-pointer ${
                        alreadyLoggedToday
                          ? 'bg-[var(--page)] text-muted cursor-default'
                          : 'bg-ink text-[var(--card)] hover:opacity-90 active:scale-95'
                      }`}
                    >
                      {alreadyLoggedToday ? 'Logged today ✓' : '+1 today'}
                    </button>
                  )}
                  {!isQuotaTask && (
                    <span className="text-[12px] text-muted">
                      {task.estimate_minutes}m
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
