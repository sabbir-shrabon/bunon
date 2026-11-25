/**
 * 1. Purpose: Contextual card slot rendered above Today's tasks in deterministic 6-level priority order.
 * 2. Spec Ref: Stitch State 24 (Welcome Back), State 25 (New Week), State 25b, State 60.
 * 3. Called By: TodayView component.
 * 4. Calls: Pure UI markup and callbacks for actions (chips, links, dismiss).
 */

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { ContextBannerData } from '@/lib/services/today-service';

interface ContextCardsProps {
  banner: ContextBannerData | null;
  onOpenWeekPlan?: () => void;
  onSelectMissCause?: (cause: string) => void;
  onDismiss?: () => void;
}

function DismissButton({ onClick }: Readonly<{ onClick?: () => void }>) {
  if (!onClick) return null;
  return (
    <button
      type="button"
      aria-label="Dismiss"
      onClick={onClick}
      className="flex h-7 w-7 -mr-1 -mt-1 shrink-0 items-center justify-center rounded-full text-muted hover:bg-secondary-surface hover:text-ink transition-colors cursor-pointer"
    >
      <X size={15} />
    </button>
  );
}

export function ContextCardSlot({
  banner,
  onOpenWeekPlan,
  onSelectMissCause,
  onDismiss,
}: Readonly<ContextCardsProps>) {
  const [selectedChip, setSelectedChip] = useState<string | null>(null);

  if (!banner || !banner.type) return null;

  return (
    <aside aria-label="Contextual notice" className="w-full mb-2.5 md:mb-4">
      {/* 1. Milestone Reached State 60 */}
      {banner.type === 'MILESTONE_REACHED_60' && (
        <div className="rounded-[20px] border border-hairline bg-card p-3.5 md:p-5 shadow-none">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-4 h-4 rounded-full bg-[var(--marigold)] flex items-center justify-center text-[10px] text-white shrink-0">
                ✓
              </span>
              <span className="text-[13.5px] font-semibold text-ink truncate">{banner.title}</span>
            </div>
            <DismissButton onClick={onDismiss} />
          </div>
          <p className="text-[12.5px] text-muted leading-snug line-clamp-2 md:line-clamp-none">
            {banner.subtitle}
          </p>
        </div>
      )}

      {/* 2. Welcome Back State 24 */}
      {banner.type === 'WELCOME_BACK_24' && (
        <div className="rounded-[20px] border border-hairline bg-card p-3.5 md:p-5 shadow-none">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <span className="text-[13.5px] font-semibold text-ink leading-snug">
              {banner.title}
            </span>
            <DismissButton onClick={onDismiss} />
          </div>
          <p className="text-[12px] text-muted mb-2.5 leading-snug line-clamp-1 md:line-clamp-none">
            {banner.subtitle}
          </p>
          {banner.chips && banner.chips.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 md:flex-wrap">
              {banner.chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setSelectedChip(chip);
                    onSelectMissCause?.(chip);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    selectedChip === chip
                      ? 'border-ink bg-ink text-[var(--card)]'
                      : 'border-hairline bg-[var(--page)] text-muted hover:text-ink'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. New Week State 25 */}
      {banner.type === 'NEW_WEEK_25' && (
        <div className="rounded-[20px] border border-hairline bg-card p-3.5 md:p-5 shadow-none flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0 pr-1 flex-1">
            <span className="text-[13.5px] font-semibold text-ink">{banner.title}</span>
            <span className="text-[12px] text-muted truncate mt-0.5">{banner.subtitle}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenWeekPlan && (
              <button
                type="button"
                onClick={onOpenWeekPlan}
                className="text-[12px] font-semibold text-ink underline-offset-2 hover:underline shrink-0 cursor-pointer"
              >
                See this week&apos;s plan ›
              </button>
            )}
            <DismissButton onClick={onDismiss} />
          </div>
        </div>
      )}

      {/* 6. Ahead Stretch Step Offer State 25b */}
      {banner.type === 'AHEAD_STRETCH_25B' && (
        <div className="rounded-[20px] border border-hairline bg-card p-3.5 md:p-5 shadow-none">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <span className="text-[13.5px] font-semibold text-ink leading-snug">
              {banner.title}
            </span>
            <DismissButton onClick={onDismiss} />
          </div>
          <p className="text-[12px] text-muted mb-2.5 leading-snug line-clamp-1 md:line-clamp-none">
            {banner.subtitle}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-ink text-[var(--card)] cursor-pointer"
            >
              Keep it light
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
