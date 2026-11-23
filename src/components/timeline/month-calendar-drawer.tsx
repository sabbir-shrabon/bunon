'use client';
/**
 * 1. Purpose: Displays on-demand State 62a Month Calendar drawer with Marigold activity dots.
 * 2. Spec Ref: Stitch State 62a and UI Design Guide Category F.
 * 3. Called By: TimelineView header Calendar icon.
 * 4. Calls: Lucide icons.
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface MonthCalendarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activityMap: Record<number, 'PROOF' | 'MILESTONE'>;
  activeDaysCount: number;
  initialYear?: number;
  initialMonth?: number;
  onSelectDay: (day: number) => void;
}

export function MonthCalendarDrawer({
  isOpen,
  onClose,
  activityMap,
  activeDaysCount,
  initialYear = new Date().getFullYear(),
  initialMonth = new Date().getMonth(),
  onSelectDay,
}: Readonly<MonthCalendarDrawerProps>) {
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);

  if (!isOpen) return null;

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  return (
    <div className="w-full bg-card border-b border-hairline px-4 py-4 animate-fade-in">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-secondary-surface text-muted"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[14px] font-semibold text-ink">{monthName}</span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-secondary-surface text-muted"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] font-medium text-muted">
            {activeDaysCount} active days
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-secondary-surface text-muted"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 text-center text-[11px] font-medium text-muted mb-1.5">
        <span>S</span>
        <span>M</span>
        <span>T</span>
        <span>W</span>
        <span>T</span>
        <span>F</span>
        <span>S</span>
      </div>

      {/* Day Cells Grid */}
      <div className="grid grid-cols-7 gap-y-1.5 text-center">
        {blanks.map((b) => (
          <div key={`blank-${b}`} className="h-8" />
        ))}
        {daysArray.map((day) => {
          const activity = activityMap[day];
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              className="h-8 flex flex-col items-center justify-center rounded-[8px] hover:bg-secondary-surface transition-colors cursor-pointer relative"
            >
              <span className="text-[12px] text-ink font-normal">{day}</span>
              {activity === 'PROOF' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFB020] mt-0.5" />
              )}
              {activity === 'MILESTONE' && (
                <span className="w-2 h-2 rounded-full border border-[#FFB020] bg-card mt-0.5 flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-[#FFB020]" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
