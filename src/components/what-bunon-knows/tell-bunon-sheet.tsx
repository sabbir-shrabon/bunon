/**
 * 1. Purpose: Input sheet for adding a new user fact with smart schedule detection.
 * 2. Spec Ref: Stitch what_bunon_knows Bottom CTA & Page 50a.
 * 3. Called By: WhatBunonKnowsView.
 * 4. Calls: PrimaryButton, BottomSheet.
 */

'use client';

import { useState } from 'react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';

const SCHEDULE_KEYWORDS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'tuition', 'classes', 'exam', 'office', 'weekend', 'busy', 'routine',
];

export function TellBunonSheet({
  isOpen,
  initialText = '',
  scope,
  onDismiss,
  onSave,
}: Readonly<{
  isOpen: boolean;
  initialText?: string;
  scope: 'PERSON' | 'GOAL';
  onDismiss: () => void;
  onSave: (fact: string, saveToAboutMe: boolean) => void;
}>) {
  const [fact, setFact] = useState(initialText);
  const [saveToAboutMe, setSaveToAboutMe] = useState(scope === 'PERSON');

  if (!isOpen) return null;

  const lower = fact.toLowerCase();
  const hasScheduleKeyword = SCHEDULE_KEYWORDS.some((kw) => lower.includes(kw));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fact.trim()) {
      onSave(fact.trim(), saveToAboutMe);
      setFact('');
    }
  };

  return (
    <BottomSheet onDismiss={onDismiss}>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <h3 className="text-[17px] font-semibold text-ink mb-1">
          Tell Bunon something
        </h3>
        <p className="text-[13px] text-muted mb-4">
          Add a life rhythm, constraint, or learning preference to sharpen your plan.
        </p>

        <textarea
          rows={3}
          maxLength={200}
          value={fact}
          onChange={(e) => setFact(e.target.value)}
          placeholder="e.g., Mondays are tuition days, keep tasks under 30 minutes"
          className="w-full rounded-xl border border-hairline bg-card p-3 text-[14px] text-ink outline-none placeholder:text-inactive focus:border-ink resize-none"
          autoFocus
        />

        {hasScheduleKeyword && scope === 'GOAL' && (
          <div className="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-secondary-surface text-[13px]">
            <span className="text-muted">Detected schedule rule</span>
            <button
              type="button"
              onClick={() => setSaveToAboutMe(!saveToAboutMe)}
              className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                saveToAboutMe
                  ? 'bg-ink text-page'
                  : 'border border-hairline bg-card text-muted'
              }`}
            >
              {saveToAboutMe ? 'Save to About me for all goals' : 'Keep on this goal only'}
            </button>
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 h-[48px] rounded-full border border-hairline text-[14px] font-medium text-ink hover:bg-secondary-surface transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <PrimaryButton
            type="submit"
            disabled={!fact.trim()}
            className="flex-1 h-[48px] text-[14px]"
          >
            Save
          </PrimaryButton>
        </div>
      </form>
    </BottomSheet>
  );
}
