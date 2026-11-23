'use client';
/**
 * 1. Purpose: Bottom sheets for pausing a goal (Sheet 53), resuming (Sheet 54), and extending deadline (Sheet 55).
 * 2. Spec Ref: UI Design Guide Category E Sheets 53, 54, 55.
 * 3. Called By: RoadmapView.
 * 4. Calls: BottomSheet, PrimaryButton, and /api/goals/[id] endpoints.
 */

import React, { useState } from 'react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';

export function PauseGoalSheet({
  isOpen,
  onClose,
  goalId,
  currentDeadline,
  onSuccess,
}: Readonly<{
  isOpen: boolean;
  onClose: () => void;
  goalId: string;
  currentDeadline: string;
  onSuccess: (newDeadline: string) => void;
}>) {
  const [days, setDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetDate = new Date(currentDeadline);
  targetDate.setDate(targetDate.getDate() + days);
  const previewDeadline = targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handlePause = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/goals/${goalId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });
      if (res.ok) {
        const data = await res.json();
        onSuccess(data.newDeadline);
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Pause goal">
      <div className="flex flex-col gap-4 pb-2">
        <p className="text-[13.5px] text-muted leading-relaxed">
          Take a temporary break. Bunon will freeze your working streak and shift your deadline forward by the paused days.
        </p>

        <div>
          <label className="text-[12px] font-medium text-ink block mb-2">
            Pause duration: {days} days (max 14 days)
          </label>
          <input
            type="range"
            min={1}
            max={14}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full accent-ink cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-muted mt-1">
            <span>1 day</span>
            <span>7 days</span>
            <span>14 days</span>
          </div>
        </div>

        <div className="p-3 rounded-[12px] bg-secondary-surface text-[12px] text-ink">
          New target deadline: <span className="font-semibold">{previewDeadline}</span>
        </div>

        <PrimaryButton onClick={handlePause} disabled={isSubmitting}>
          {isSubmitting ? 'Pausing...' : `Pause for ${days} days`}
        </PrimaryButton>
      </div>
    </BottomSheet>
  );
}

export function ExtendDeadlineSheet({
  isOpen,
  onClose,
  goalId,
  currentDeadline,
  onSuccess,
}: Readonly<{
  isOpen: boolean;
  onClose: () => void;
  goalId: string;
  currentDeadline: string;
  onSuccess: (newDeadline: string) => void;
}>) {
  const [newDate, setNewDate] = useState(currentDeadline);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleExtend = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/goals/${goalId}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDeadline: newDate }),
      });
      if (res.ok) {
        onSuccess(newDate);
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Extend deadline">
      <div className="flex flex-col gap-4 pb-2">
        <p className="text-[13.5px] text-muted leading-relaxed">
          Choose a realistic new deadline date. Your completed milestones and proofs stay safely locked.
        </p>

        <div>
          <label className="text-[12px] font-medium text-ink block mb-1.5">New deadline date</label>
          <input
            type="date"
            value={newDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full h-11 px-3 rounded-[12px] border border-hairline bg-card text-ink text-[14px]"
          />
        </div>

        <PrimaryButton onClick={handleExtend} disabled={isSubmitting || newDate === currentDeadline}>
          {isSubmitting ? 'Updating...' : 'Save new deadline'}
        </PrimaryButton>
      </div>
    </BottomSheet>
  );
}
