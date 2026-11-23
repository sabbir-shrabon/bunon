'use client';
/**
 * 1. Purpose: Confirmation sheet for reversing task completion and deleting attached proof.
 * 2. Spec Ref: Stitch Screen 22, Undo Completed Task Confirmation Sheet Contract.
 * 3. Called By: TodayView component.
 * 4. Calls: BottomSheet, fetch /api/tasks/[id]/uncomplete.
 */

import React, { useState } from 'react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import type { ThreadTaskItem } from './types';

interface UndoCompleteSheetProps {
  isOpen: boolean;
  task: ThreadTaskItem | null;
  onClose: () => void;
  onSuccess: (taskId: string) => void;
}

export function UndoCompleteSheet({
  isOpen,
  task,
  onClose,
  onSuccess,
}: Readonly<UndoCompleteSheetProps>) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!task) return null;

  const photoProof = task.evidence?.find((e) => e.type === 'PHOTO');
  const noteProof = task.evidence?.find((e) => e.type === 'NOTE');
  const linkProof = task.evidence?.find((e) => e.type === 'LINK');
  const primaryEvidence = photoProof || noteProof || linkProof || task.evidence?.[0];

  const handleConfirmUndo = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}/uncomplete`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Failed to undo task completion');
      }
      onSuccess(task.id);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error undoing task completion');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Mark this task as not done?">
      <div className="flex flex-col gap-4">
        {/* Warning copy */}
        <p className="text-[14px] text-muted leading-relaxed">
          Moving this task back to pending will permanently delete its attached proof and remove it from your Timeline and Roadmap.
        </p>

        {/* Proof item to be deleted preview box */}
        {primaryEvidence && (
          <div className="flex items-center gap-3 p-3 bg-[var(--page)] border border-hairline rounded-2xl">
            {photoProof?.signed_url ? (
              <img
                src={photoProof.signed_url}
                alt="Proof to be deleted"
                className="w-12 h-12 rounded-xl object-cover border border-hairline shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-card border border-hairline flex items-center justify-center text-[18px] shrink-0">
                {noteProof ? '📝' : '🔗'}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-medium text-ink truncate">
                {primaryEvidence.caption_note || task.title}
              </span>
              <span className="text-[12px] text-muted truncate">
                {photoProof ? 'Photo proof' : noteProof ? 'Day note proof' : 'Link proof'}
              </span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-[13px] text-center">
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          {/* Destructive Button */}
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirmUndo}
            className="w-full h-12 rounded-full border border-[#B42318] text-[#B42318] hover:bg-[#B42318]/5 active:bg-[#B42318]/10 font-semibold text-[14px] transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50"
          >
            {isDeleting ? 'Undoing and deleting…' : 'Undo and delete proof'}
          </button>

          {/* Safe Primary Button */}
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="w-full h-12 rounded-full bg-ink text-[var(--card)] hover:opacity-90 active:scale-[0.99] font-medium text-[14px] transition-all cursor-pointer flex items-center justify-center shadow-none disabled:opacity-50"
          >
            Keep task done
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
