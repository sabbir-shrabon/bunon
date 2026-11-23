/**
 * 1. Purpose: Day note bottom sheet (Sheet 34) for $0 zero-token reflections and 0ms crisis safety checking.
 * 2. Spec Ref: Stitch Sheet 34 & Helpline Screen 16.
 * 3. Called By: Today view '+ Add a day note' button.
 * 4. Calls: BottomSheet, PrimaryButton, and /api/day-notes.
 */

'use client';

import { useState } from 'react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';

interface DayNoteSheetProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: string;
  initialText?: string;
  onSaved: (text: string) => void;
}

export function DayNoteSheet({
  isOpen,
  onClose,
  goalId,
  initialText = '',
  onSaved,
}: Readonly<DayNoteSheetProps>) {
  const [noteText, setNoteText] = useState(initialText);
  const [isSaving, setIsSaving] = useState(false);
  const [helplineAlert, setHelplineAlert] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!noteText.trim()) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/day-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId, text: noteText }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Could not save note');
        return;
      }

      if (data.helplineRequired) {
        setHelplineAlert(data.helplineMessage || 'Support is available. Please reach out.');
        return;
      }

      onSaved(noteText);
      onClose();
    } catch {
      setErrorMessage('Connection error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Day note">
      <div className="flex flex-col gap-4 pt-1 pb-4">
        <div>
          <p className="text-[12px] text-muted">
            Only you can see this note
          </p>
        </div>

        {/* Helpline Screen 16 Banner if crisis detected */}
        {helplineAlert && (
          <div className="rounded-xl border border-hairline bg-[var(--page)] p-4 text-[13px] text-ink leading-relaxed">
            <div className="font-semibold mb-1 text-[14px]">You are not alone</div>
            <p className="text-muted mb-3">{helplineAlert}</p>
            <div className="flex gap-2">
              <a
                href="tel:999"
                className="px-3 py-1.5 rounded-full bg-ink text-[var(--card)] text-[12px] font-medium"
              >
                Call 999
              </a>
              <a
                href="tel:+8801779554391"
                className="px-3 py-1.5 rounded-full border border-hairline text-[12px] font-medium text-ink"
              >
                Kaan Pete Roi
              </a>
            </div>
          </div>
        )}

        {/* Plain Text Box (NO emoji, NO chips) */}
        {!helplineAlert && (
          <div className="flex flex-col gap-1.5">
            <textarea
              rows={4}
              maxLength={500}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Anything that got in the way today?"
              className="w-full rounded-xl border border-hairline bg-card p-3.5 text-[14px] text-ink placeholder:text-muted focus:border-ink focus:outline-none transition-colors resize-none"
            />
            <div className="flex justify-between text-[11px] text-muted px-1">
              <span>Saved at $0 token cost · Digested on weekly rollover</span>
              <span>{noteText.length}/500</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <p className="text-[12px] text-red-600 px-1">{errorMessage}</p>
        )}

        {!helplineAlert && (
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[13px] font-medium text-muted hover:text-ink transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <PrimaryButton onClick={handleSave} disabled={isSaving || !noteText.trim()}>
              {isSaving ? 'Saving…' : 'Save note'}
            </PrimaryButton>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
