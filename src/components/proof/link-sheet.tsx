/**
 * 1. Purpose: Bottom sheet for pasting an external URL as proof (Sheet 42).
 * 2. Spec Ref: Stitch Sheet 42 (Add a link as proof).
 * 3. Called By: Create proof page link icon tap.
 * 4. Calls: BottomSheet and PrimaryButton.
 */

'use client';

import { useState } from 'react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';

interface LinkSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLink: (url: string) => void;
}

export function LinkSheet({
  isOpen,
  onClose,
  onAddLink,
}: Readonly<LinkSheetProps>) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a link');
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setError('Link must start with http:// or https://');
      return;
    }
    onAddLink(trimmed);
    setUrl('');
    setError('');
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Add a link as proof">
      <div className="flex flex-col gap-4 py-2">
        <p className="text-[13px] text-muted">
          Paste a link to your document, commit, tweet, or published work.
        </p>

        <div className="flex flex-col gap-1">
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError('');
            }}
            placeholder="https://example.com/my-work"
            className="w-full h-12 rounded-xl border border-hairline bg-card px-3.5 text-[14px] text-ink placeholder:text-muted focus:border-ink focus:outline-none transition-colors"
          />
          {error && <span className="text-[12px] text-red-600 px-1">{error}</span>}
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] font-medium text-muted hover:text-ink transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <PrimaryButton onClick={handleSubmit} disabled={!url.trim()}>
            Add link
          </PrimaryButton>
        </div>
      </div>
    </BottomSheet>
  );
}
