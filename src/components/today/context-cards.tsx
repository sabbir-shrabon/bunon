/**
 * 1. Purpose: Contextual card slot rendered above Today's tasks in deterministic 6-level priority order.
 * 2. Spec Ref: Stitch State 24 (Welcome Back), State 25 (New Week), State 25b, State 60.
 * 3. Called By: TodayView component.
 * 4. Calls: Pure UI markup and callbacks for actions (chips, links, dismiss).
 */

'use client';

import { useState } from 'react';
import type { ContextBannerData } from '@/lib/services/today-service';

interface ContextCardsProps {
  banner: ContextBannerData | null;
  onOpenWeekPlan?: () => void;
  onSelectMissCause?: (cause: string) => void;
  onDismiss?: () => void;
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
    <aside aria-label="Contextual notice" className="w-full mb-4">
      {/* 1. Milestone Reached State 60 */}
      {banner.type === 'MILESTONE_REACHED_60' && (
        <div className="rounded-[20px] border border-hairline bg-card p-5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-4 h-4 rounded-full bg-[var(--marigold)] flex items-center justify-center text-[10px] text-white">
              ✓
            </span>
            <span className="text-[14px] font-semibold text-ink">{banner.title}</span>
          </div>
          <p className="text-[13px] text-muted mb-3 leading-relaxed">
            {banner.subtitle}
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onDismiss}
              className="text-[12px] font-medium text-muted hover:text-ink transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 2. Welcome Back State 24 */}
      {banner.type === 'WELCOME_BACK_24' && (
        <div className="rounded-[20px] border border-hairline bg-card p-5">
          <div className="text-[14px] font-semibold text-ink mb-1">{banner.title}</div>
          <p className="text-[13px] text-muted mb-3 leading-relaxed">
            {banner.subtitle}
          </p>
          {banner.chips && banner.chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {banner.chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setSelectedChip(chip);
                    onSelectMissCause?.(chip);
                  }}
                  className={`text-[12px] px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
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
        <div className="rounded-[20px] border border-hairline bg-card p-5 flex items-center justify-between">
          <div className="flex flex-col min-w-0 pr-3">
            <span className="text-[14px] font-semibold text-ink">{banner.title}</span>
            <span className="text-[13px] text-muted truncate">{banner.subtitle}</span>
          </div>
          {onOpenWeekPlan && (
            <button
              type="button"
              onClick={onOpenWeekPlan}
              className="text-[12px] font-semibold text-ink underline-offset-2 hover:underline shrink-0 cursor-pointer"
            >
              See this week's plan ›
            </button>
          )}
        </div>
      )}

      {/* 6. Ahead Stretch Step Offer State 25b */}
      {banner.type === 'AHEAD_STRETCH_25B' && (
        <div className="rounded-[20px] border border-hairline bg-card p-5">
          <div className="text-[14px] font-semibold text-ink mb-1">{banner.title}</div>
          <p className="text-[13px] text-muted mb-3 leading-relaxed">
            {banner.subtitle}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onDismiss}
              className="text-[12px] font-medium px-3.5 py-1.5 rounded-full bg-ink text-[var(--card)] cursor-pointer"
            >
              Keep it light
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
