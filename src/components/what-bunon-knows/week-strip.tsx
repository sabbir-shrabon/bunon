/**
 * 1. Purpose: Renders the 7-day weekday focus time strip for What Bunon Knows.
 * 2. Spec Ref: Stitch what_bunon_knows Card 1 & Page 50a.
 * 3. Called By: WhatBunonKnowsView.
 * 4. Calls: Native div and button elements.
 */

'use client';

import React from 'react';
import type { DayTimeMap } from '@/types/domain';

const weekdays = [
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
];

export function WeekStrip({
  dayTimeMap,
  onChange,
}: Readonly<{
  dayTimeMap: DayTimeMap;
  onChange: (updated: DayTimeMap) => void;
}>) {
  const getMinutes = (dayKey: string): number => {
    const entry = dayTimeMap[dayKey];
    if (typeof entry === 'number') return entry;
    return entry?.available_minutes ?? 60;
  };

  const cycleMinutes = (dayKey: string) => {
    const current = getMinutes(dayKey);
    const next = current >= 180 ? 0 : current + 30;
    const updated: DayTimeMap = {
      ...dayTimeMap,
      [dayKey]: { available_minutes: next },
    };
    onChange(updated);
  };

  return (
    <section className="bg-card rounded-[20px] border border-hairline p-5 shadow-none flex flex-col">
      <div className="flex items-baseline justify-between">
        <h2 className="text-ink text-[17px] font-semibold tracking-tight">Your week</h2>
        <span className="text-muted text-[12px] font-medium">Daily focus time (tap to change)</span>
      </div>

      <div
        aria-label="Daily focus schedule"
        className="grid grid-cols-7 gap-1.5 mt-3.5"
        role="group"
      >
        {weekdays.map(({ key, label }) => {
          const minutes = getMinutes(key);
          const isHighlighted = minutes > 0 && minutes <= 30; // Light tuition/pinch day

          return (
            <button
              key={key}
              type="button"
              onClick={() => cycleMinutes(key)}
              className={`flex flex-col items-center justify-center rounded-xl border py-2 px-0.5 transition-colors cursor-pointer ${
                isHighlighted
                  ? 'border-marigold/60 bg-amber-50/50 dark:bg-amber-950/20'
                  : minutes === 0
                  ? 'border-hairline bg-canvas opacity-50'
                  : 'border-hairline bg-card hover:border-ink'
              }`}
            >
              <span className="text-[11px] font-medium text-muted">{label}</span>
              <span className="text-[13px] font-semibold text-ink mt-0.5">
                {minutes === 0 ? 'Off' : `${minutes}m`}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
