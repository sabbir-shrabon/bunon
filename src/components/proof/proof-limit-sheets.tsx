/**
 * 1. Purpose: Bottom sheets for photo quota limits (Sheet 47), Pro gates (Sheet 48), and storage full (Sheet 119).
 * 2. Spec Ref: Stitch Sheet 47, Sheet 48, and Sheet 119.
 * 3. Called By: Create proof screen.
 * 4. Calls: BottomSheet, PrimaryButton, and useRouter.
 */

'use client';

import { useRouter } from 'next/navigation';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';

interface LimitSheetProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'PHOTO_LIMIT_47' | 'PRO_LOCKED_48' | 'STORAGE_FULL_119';
  onUseNoteOrLink?: () => void;
}

export function ProofLimitSheet({
  isOpen,
  onClose,
  type,
  onUseNoteOrLink,
}: Readonly<LimitSheetProps>) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col text-center px-2 py-3">
        {type === 'PHOTO_LIMIT_47' && (
          <>
            <h3 className="text-[18px] font-semibold text-ink mb-1.5">
              Daily photo used
            </h3>
            <p className="text-[13px] text-muted mb-6 px-3 leading-relaxed">
              You have used today's photo proof. Add a written note or a link instead to finish today's task.
            </p>
            <div className="flex flex-col gap-2.5">
              <PrimaryButton
                onClick={() => {
                  onClose();
                  onUseNoteOrLink?.();
                }}
              >
                Add a note or link instead
              </PrimaryButton>
              <button
                type="button"
                onClick={() => router.push('/upgrade')}
                className="text-[13px] font-medium text-ink underline-offset-2 hover:underline py-2 cursor-pointer"
              >
                Upgrade to Bunon Pro for unlimited photos
              </button>
            </div>
          </>
        )}

        {type === 'PRO_LOCKED_48' && (
          <>
            <h3 className="text-[18px] font-semibold text-ink mb-1.5">
              Bunon Pro feature
            </h3>
            <p className="text-[13px] text-muted mb-6 px-3 leading-relaxed">
              Video (up to 30s) and document attachments (PDF/code) require an active Bunon Pro pass.
            </p>
            <div className="flex flex-col gap-2.5">
              <PrimaryButton onClick={() => router.push('/upgrade')}>
                Upgrade to Pro
              </PrimaryButton>
              <button
                type="button"
                onClick={onClose}
                className="text-[13px] font-medium text-muted hover:text-ink py-2 cursor-pointer"
              >
                Not now
              </button>
            </div>
          </>
        )}

        {type === 'STORAGE_FULL_119' && (
          <>
            <h3 className="text-[18px] font-semibold text-ink mb-1.5">
              Storage quota full
            </h3>
            <p className="text-[13px] text-muted mb-6 px-3 leading-relaxed">
              You have reached your storage limit. Upgrade to Pro for 2 GB of storage, or add written notes and links.
            </p>
            <div className="flex flex-col gap-2.5">
              <PrimaryButton onClick={() => router.push('/upgrade')}>
                Upgrade for 2 GB storage
              </PrimaryButton>
              <button
                type="button"
                onClick={onClose}
                className="text-[13px] font-medium text-muted hover:text-ink py-2 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
