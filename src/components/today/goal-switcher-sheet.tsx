/**
 * 1. Purpose: Goal switcher dropdown/sheet (Sheet 31) and active-goal limit gate (Sheet 32).
 * 2. Spec Ref: Stitch Sheet 31 & Sheet 32.
 * 3. Called By: Today sub-header Goal Switcher pill.
 * 4. Calls: BottomSheet, PrimaryButton, and useRouter.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import type { TodayGoalItem } from './types';

interface GoalSwitcherSheetProps {
  isOpen: boolean;
  onClose: () => void;
  goals: TodayGoalItem[];
  activeGoalId: string;
  isPro?: boolean;
  onSelectGoal: (goalId: string) => void;
}

export function GoalSwitcherSheet({
  isOpen,
  onClose,
  goals,
  activeGoalId,
  isPro = false,
  onSelectGoal,
}: Readonly<GoalSwitcherSheetProps>) {
  const router = useRouter();
  const [showGate, setShowGate] = useState(false);

  if (!isOpen) return null;

  const handleAddGoal = () => {
    const maxAllowed = isPro ? 3 : 1;
    if (goals.length >= maxAllowed) {
      setShowGate(true);
    } else {
      onClose();
      router.push('/onboarding');
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={showGate ? 'Goal Limit' : 'Your Goals'}>
      {showGate ? (
        /* Sheet 32: Add another goal gate */
        <div className="flex flex-col gap-4 text-center py-2">
          <h3 className="text-[17px] font-semibold text-ink">
            {isPro
              ? 'You have 3 active goals'
              : 'Free plan limit reached'}
          </h3>
          <p className="text-[13px] text-muted leading-relaxed px-4">
            {isPro
              ? 'Finish or pause one of your active goals before starting a new one.'
              : 'Free accounts track 1 goal at a time with full focus. Upgrade to Pro for up to 3 active goals.'}
          </p>

          <div className="pt-2 flex flex-col gap-2">
            {!isPro && (
              <PrimaryButton onClick={() => router.push('/upgrade')}>
                Upgrade to Bunon Pro
              </PrimaryButton>
            )}
            <button
              type="button"
              onClick={() => setShowGate(false)}
              className="text-[13px] font-medium text-muted hover:text-ink transition-colors cursor-pointer py-2"
            >
              Back to goals
            </button>
          </div>
        </div>
      ) : (
        /* Sheet 31: Goal list */
        <div className="flex flex-col gap-2 py-1">
          {goals.map((g) => {
            const isActive = g.id === activeGoalId;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  onSelectGoal(g.id);
                  onClose();
                }}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'border-ink bg-[var(--page)]'
                    : 'border-hairline/60 hover:bg-[var(--secondary-surface)]'
                }`}
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-[14px] font-medium text-ink truncate">{g.title}</span>
                  <span className="text-[12px] text-muted capitalize">{g.category.toLowerCase()}</span>
                </div>
                {g.pendingCount > 0 && (
                  <span className="rounded-full bg-[var(--secondary-surface)] px-2 py-0.5 text-[11px] font-medium text-ink shrink-0">
                    {g.pendingCount} left
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-3 border-t border-hairline/60">
            <button
              type="button"
              onClick={handleAddGoal}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-dashed border-hairline hover:border-ink text-[13px] font-medium text-ink transition-colors cursor-pointer"
            >
              <span>+ Add another goal</span>
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
