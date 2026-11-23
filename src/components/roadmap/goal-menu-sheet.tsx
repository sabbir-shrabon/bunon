'use client';
/**
 * 1. Purpose: Renders Sheet 52 Goal Menu with style switcher, pause, extend, restructure, and rescue.
 * 2. Spec Ref: UI Design Guide Category E Sheet 52 and Section 6.
 * 3. Called By: RoadmapView header '⋯' button.
 * 4. Calls: BottomSheet, next/navigation, and /api/goals/[id]/style.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarClock,
  ChevronRight,
  GitFork,
  HelpCircle,
  PauseCircle,
  Sliders,
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import type { PlanStyle } from '@/types/domain';

interface GoalMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: string;
  currentPlanStyle: PlanStyle;
  onOpenPause: () => void;
  onOpenExtend: () => void;
  onOpenRescue: () => void;
  onStyleChanged: (newStyle: PlanStyle) => void;
}

export function GoalMenuSheet({
  isOpen,
  onClose,
  goalId,
  currentPlanStyle,
  onOpenPause,
  onOpenExtend,
  onOpenRescue,
  onStyleChanged,
}: Readonly<GoalMenuSheetProps>) {
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);

  const toggleStyle = async () => {
    const nextStyle: PlanStyle =
      currentPlanStyle === 'FLEXIBLE_WEEK' ? 'DAILY_ADAPTIVE' : 'FLEXIBLE_WEEK';
    setIsSwitching(true);
    try {
      const res = await fetch(`/api/goals/${goalId}/style`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planStyle: nextStyle }),
      });
      if (res.ok) {
        onStyleChanged(nextStyle);
      }
    } finally {
      setIsSwitching(false);
    }
  };

  const handleRestructure = () => {
    onClose();
    router.push(`/roadmap/replan?goalId=${goalId}`);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Goal settings">
      <div className="flex flex-col w-full divide-y divide-hairline pb-2">
        {/* 1. Change Weekly Style */}
        <button
          type="button"
          onClick={toggleStyle}
          disabled={isSwitching}
          className="flex items-center justify-between py-3 text-left hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Sliders size={18} className="text-muted shrink-0" />
            <div>
              <div className="text-[14px] font-medium text-ink">Change weekly style</div>
              <div className="text-[12px] text-muted">
                Currently: {currentPlanStyle === 'FLEXIBLE_WEEK' ? 'Flexible week' : 'Daily adaptive'} ($0)
              </div>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted" />
        </button>

        {/* 2. Pause Goal */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenPause();
          }}
          className="flex items-center justify-between py-3 text-left hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <PauseCircle size={18} className="text-muted shrink-0" />
            <div>
              <div className="text-[14px] font-medium text-ink">Pause goal</div>
              <div className="text-[12px] text-muted">Take a break for up to 14 days</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted" />
        </button>

        {/* 3. Extend Deadline */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenExtend();
          }}
          className="flex items-center justify-between py-3 text-left hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <CalendarClock size={18} className="text-muted shrink-0" />
            <div>
              <div className="text-[14px] font-medium text-ink">Extend deadline</div>
              <div className="text-[12px] text-muted">Shift deadline forward up to 12 months</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted" />
        </button>

        {/* 4. Restructure Roadmap */}
        <button
          type="button"
          onClick={handleRestructure}
          className="flex items-center justify-between py-3 text-left hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <GitFork size={18} className="text-muted shrink-0" />
            <div>
              <div className="text-[14px] font-medium text-ink">Restructure roadmap</div>
              <div className="text-[12px] text-muted">Revise unfinished milestones (locks finished)</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted" />
        </button>

        {/* 5. Feeling like stopping? */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenRescue();
          }}
          className="flex items-center justify-between py-3 text-left hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <HelpCircle size={18} className="text-muted shrink-0" />
            <div>
              <div className="text-[14px] font-medium text-ink">Feeling like stopping?</div>
              <div className="text-[12px] text-muted">Shrink to minimum viable goal, pivot, or archive</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted" />
        </button>
      </div>
    </BottomSheet>
  );
}
