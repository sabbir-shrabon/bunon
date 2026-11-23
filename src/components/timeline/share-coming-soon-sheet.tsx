'use client';
/**
 * 1. Purpose: Renders Sheet 66a 'Share timeline: Coming soon' notice.
 * 2. Spec Ref: UI Design Guide Category F Sheet 66a.
 * 3. Called By: TimelineView header Share icon.
 * 4. Calls: BottomSheet and PrimaryButton.
 */

import React from 'react';
import { Lock } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';

export function ShareComingSoonSheet({
  isOpen,
  onClose,
}: Readonly<{
  isOpen: boolean;
  onClose: () => void;
}>) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Share timeline">
      <div className="flex flex-col items-center text-center gap-3.5 pb-2">
        <div className="w-10 h-10 rounded-full bg-secondary-surface flex items-center justify-center text-ink">
          <Lock size={20} />
        </div>
        <div>
          <h3 className="text-[16px] font-bold text-ink">Public sharing is coming soon</h3>
          <p className="text-[13px] text-muted leading-relaxed mt-1.5 max-w-[320px]">
            Your personal timeline is currently private and visible only to you. We are building safe link sharing and moderation tools.
          </p>
        </div>
        <div className="w-full mt-2">
          <PrimaryButton onClick={onClose}>Got it</PrimaryButton>
        </div>
      </div>
    </BottomSheet>
  );
}
