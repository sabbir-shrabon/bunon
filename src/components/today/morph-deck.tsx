'use client';
/**
 * 1. Purpose: 3-Slot Fluid Morph Deck with gestural navigation, cooldown, and floating return pill.
 * 2. Spec Ref: Stitch Screen 22, 3-Slot Fluid Morph Deck Contract.
 * 3. Called By: TodayView component.
 * 4. Calls: CompressedTaskSlot, CompletedHeroCard, and HeroTaskCard.
 */

import React, { useRef, useEffect } from 'react';
import type { MilestoneRow } from '@/types/db/goal-tables';
import type { SubStepItem, StepSlicerResult } from '@/types/domain';
import type { ThreadTaskItem } from './types';
import { CompressedTaskSlot } from './compressed-task-slot';
import { CompletedHeroCard } from './completed-hero-card';
import { HeroTaskCard } from './hero-task-card';

interface MorphDeckProps {
  threadTasks: ThreadTaskItem[];
  focusedIndex: number;
  activeTaskIndex: number;
  setFocusedIndex: React.Dispatch<React.SetStateAction<number>>;
  heroTaskSteps: SubStepItem[];
  currentMilestone: MilestoneRow | null;
  adaptiveSlice: StepSlicerResult | null;
  planStyle: string;
  isAnyModalOpen: boolean;
  hasVisibleBanner?: boolean;
  onOpenWhyThisTask: () => void;
  onOpenStuckSheet: () => void;
  onToggleSubstep: (stepNumber: number, done: boolean) => Promise<void>;
  onToggle10Min: (active: boolean) => Promise<void>;
  onUndoAdjustment: () => Promise<void>;
  onCameraClick: () => void;
  onNoteLinkClick: () => void;
  onMarkTaskNotDone: (task: ThreadTaskItem) => void;
}

export function MorphDeck({
  threadTasks,
  focusedIndex,
  activeTaskIndex,
  setFocusedIndex,
  heroTaskSteps,
  currentMilestone,
  adaptiveSlice,
  planStyle,
  isAnyModalOpen,
  hasVisibleBanner = false,
  onOpenWhyThisTask,
  onOpenStuckSheet,
  onToggleSubstep,
  onToggle10Min,
  onUndoAdjustment,
  onCameraClick,
  onNoteLinkClick,
  onMarkTaskNotDone,
}: Readonly<MorphDeckProps>) {
  const dragStartYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const wheelCooldownRef = useRef(false);

  // 1. Mobile Pointer / Touch Drag
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea')) return;
    dragStartYRef.current = e.clientY;
    isDraggingRef.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || dragStartYRef.current === null) return;
    const diffY = e.clientY - dragStartYRef.current;
    if (diffY > 34) {
      isDraggingRef.current = false;
      dragStartYRef.current = null;
      if (focusedIndex > 0) {
        setFocusedIndex((prev) => Math.max(0, prev - 1));
      }
    } else if (diffY < -34) {
      isDraggingRef.current = false;
      dragStartYRef.current = null;
      if (focusedIndex < threadTasks.length - 1) {
        setFocusedIndex((prev) => Math.min(threadTasks.length - 1, prev + 1));
      }
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    dragStartYRef.current = null;
  };

  // 2. Desktop Mouse-Wheel Morph with 420ms Cooldown
  const handleWheel = (e: React.WheelEvent) => {
    if (wheelCooldownRef.current || isAnyModalOpen) return;
    if (Math.abs(e.deltaY) < 20) return;

    if (e.deltaY > 20 && focusedIndex < threadTasks.length - 1) {
      wheelCooldownRef.current = true;
      setFocusedIndex((prev) => Math.min(threadTasks.length - 1, prev + 1));
      setTimeout(() => {
        wheelCooldownRef.current = false;
      }, 420);
    } else if (e.deltaY < -20 && focusedIndex > 0) {
      wheelCooldownRef.current = true;
      setFocusedIndex((prev) => Math.max(0, prev - 1));
      setTimeout(() => {
        wheelCooldownRef.current = false;
      }, 420);
    }
  };

  // 3. ArrowUp / ArrowDown Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isEditing || isAnyModalOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(threadTasks.length - 1, prev + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [threadTasks.length, isAnyModalOpen, setFocusedIndex]);

  if (threadTasks.length === 0) return null;

  const prevIndex = focusedIndex - 1;
  const centerTask = threadTasks[focusedIndex] || threadTasks[0];
  const nextIndex = focusedIndex + 1;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      className="flex flex-col gap-2.5 md:gap-3 relative select-none w-full"
    >
      {/* Slot 1: Previous Compressed Task */}
      {prevIndex >= 0 && (
        <div
          className={`transition-all duration-[440ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            hasVisibleBanner && focusedIndex === activeTaskIndex ? 'hidden md:block' : ''
          }`}
        >
          <CompressedTaskSlot
            task={threadTasks[prevIndex]}
            isActiveHero={prevIndex === activeTaskIndex}
            position="prev"
            onClick={() => setFocusedIndex(prevIndex)}
          />
        </div>
      )}

      {/* Slot 2: Expanded Center Hero Card */}
      <div className="transition-all duration-[440ms] ease-[cubic-bezier(0.22,1,0.36,1)]">
        {centerTask.status === 'DONE' ? (
          <CompletedHeroCard
            task={centerTask}
            onOpenWhyThisTask={onOpenWhyThisTask}
            onMarkNotDone={() => onMarkTaskNotDone(centerTask)}
          />
        ) : (
          <HeroTaskCard
            task={centerTask}
            steps={heroTaskSteps}
            milestone={currentMilestone}
            adaptiveSlice={adaptiveSlice}
            planStyle={planStyle}
            onOpenWhyThisTask={onOpenWhyThisTask}
            onOpenStuckSheet={onOpenStuckSheet}
            onToggleSubstep={onToggleSubstep}
            onToggle10Min={onToggle10Min}
            onUndoAdjustment={onUndoAdjustment}
            onCameraClick={onCameraClick}
            onNoteLinkClick={onNoteLinkClick}
          />
        )}
      </div>

      {/* Slot 3: Next Compressed Task */}
      {nextIndex < threadTasks.length && (
        <div className="transition-all duration-[440ms] ease-[cubic-bezier(0.22,1,0.36,1)]">
          <CompressedTaskSlot
            task={threadTasks[nextIndex]}
            isActiveHero={nextIndex === activeTaskIndex}
            position="next"
            onClick={() => setFocusedIndex(nextIndex)}
          />
        </div>
      )}

      {/* Floating 'Back to today' Pill */}
      {focusedIndex !== activeTaskIndex && (
        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-8 left-1/2 md:left-[calc(50%+125px)] -translate-x-1/2 z-30 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
          <button
            type="button"
            onClick={() => setFocusedIndex(activeTaskIndex)}
            className="h-10 px-5 rounded-full bg-ink text-[var(--card)] font-medium text-[13px] flex items-center gap-1.5 shadow-md active:scale-95 hover:opacity-95 transition-all cursor-pointer"
          >
            <span>{focusedIndex < activeTaskIndex ? 'Back to today ↓' : 'Back to today ↑'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
