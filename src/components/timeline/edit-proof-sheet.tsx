'use client';
/**
 * 1. Purpose: Bottom sheet for Screen 65 Edit proof with caption editing and visibility toggles.
 * 2. Spec Ref: UI Design Guide Category F Screen 65.
 * 3. Called By: TimelineView and EntryDetailViewer.
 * 4. Calls: BottomSheet, PrimaryButton, and /api/timeline/[id].
 */

import React, { useState } from 'react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import type { TimelinePost } from '@/lib/services/timeline-service';
import type { EvidenceVisibility } from '@/types/domain';

interface EditProofSheetProps {
  post: TimelinePost | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedPost: TimelinePost) => void;
}

export function EditProofSheet({
  post,
  isOpen,
  onClose,
  onUpdated,
}: Readonly<EditProofSheetProps>) {
  const [caption, setCaption] = useState(post?.caption || '');
  const [visibility, setVisibility] = useState<EvidenceVisibility>(
    post?.visibility || 'PRIVATE'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!post) return null;

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/timeline/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, visibility }),
      });
      if (res.ok) {
        onUpdated({ ...post, caption, visibility });
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Edit proof">
      <div className="flex flex-col gap-4 pb-2">
        <div>
          <label className="text-[12px] font-medium text-ink block mb-1.5">
            Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            placeholder="What did you do?"
            className="w-full p-3 rounded-[14px] border border-hairline bg-card text-ink text-[14px] resize-none focus:outline-none"
          />
        </div>

        {/* Visibility Toggle */}
        <div className="flex items-center justify-between p-3 rounded-[14px] bg-secondary-surface">
          <div>
            <div className="text-[13px] font-medium text-ink">Visibility</div>
            <div className="text-[11px] text-muted">
              {visibility === 'PUBLIC'
                ? 'Visible on public timeline if enabled'
                : 'Visible only to you'}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={visibility === 'PUBLIC'}
            onClick={() => setVisibility(visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC')}
            className={`relative h-6 w-11 rounded-full p-0.5 transition-colors cursor-pointer ${
              visibility === 'PUBLIC' ? 'bg-[#1A1A1B]' : 'bg-[#D5D8DC]'
            }`}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                visibility === 'PUBLIC' ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        <PrimaryButton onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </PrimaryButton>
      </div>
    </BottomSheet>
  );
}
