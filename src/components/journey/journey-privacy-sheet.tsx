'use client';
/**
 * 1. Purpose: Bottom sheet for Sheet 100 controlling Journey Card visibility and public link sharing.
 * 2. Spec Ref: UI Design Guide Category H Sheet 100.
 * 3. Called By: JourneyCardView header Privacy/Share button.
 * 4. Calls: BottomSheet, PrimaryButton, and clipboard API.
 */

import React, { useState } from 'react';
import { Check, Copy, Globe, Lock } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import type { JourneyCardVisibility } from '@/types/domain';

interface JourneyPrivacySheetProps {
  isOpen: boolean;
  onClose: () => void;
  publicSlug: string;
  initialVisibility: JourneyCardVisibility;
  onVisibilityChanged: (newVisibility: JourneyCardVisibility) => void;
}

export function JourneyPrivacySheet({
  isOpen,
  onClose,
  publicSlug,
  initialVisibility,
  onVisibilityChanged,
}: Readonly<JourneyPrivacySheetProps>) {
  const [visibility, setVisibility] = useState<JourneyCardVisibility>(initialVisibility);
  const [copied, setCopied] = useState(false);

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/journey/${publicSlug}`
    : `/journey/${publicSlug}`;

  const handleToggle = () => {
    const next: JourneyCardVisibility =
      visibility === 'PRIVATE' ? 'PUBLIC_LINK' : 'PRIVATE';
    setVisibility(next);
    onVisibilityChanged(next);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Journey Card privacy">
      <div className="flex flex-col gap-4 pb-2">
        <p className="text-[13px] text-muted leading-relaxed">
          Choose who can view your Journey Card. Private day notes are never shown, and photo metadata is cleanly stripped.
        </p>

        {/* Visibility Choice */}
        <div className="flex items-center justify-between p-3.5 rounded-[14px] bg-secondary-surface">
          <div className="flex items-center gap-2.5">
            {visibility === 'PUBLIC_LINK' ? (
              <Globe size={18} className="text-ink" />
            ) : (
              <Lock size={18} className="text-muted" />
            )}
            <div>
              <div className="text-[13.5px] font-medium text-ink">
                {visibility === 'PUBLIC_LINK' ? 'Anyone with the link' : 'Private (Only me)'}
              </div>
              <div className="text-[11px] text-muted">
                {visibility === 'PUBLIC_LINK' ? 'Shareable on social networks' : 'Visible only on this device'}
              </div>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={visibility === 'PUBLIC_LINK'}
            onClick={handleToggle}
            className={`relative h-6 w-11 rounded-full p-0.5 transition-colors cursor-pointer ${
              visibility === 'PUBLIC_LINK' ? 'bg-[#1A1A1B]' : 'bg-[#D5D8DC]'
            }`}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                visibility === 'PUBLIC_LINK' ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Copy Link when Public */}
        {visibility === 'PUBLIC_LINK' && (
          <div className="flex flex-col gap-2 pt-1">
            <PrimaryButton onClick={handleCopy}>
              <div className="flex items-center justify-center gap-2">
                {copied ? <Check size={18} /> : <Copy size={18} />}
                <span>{copied ? 'Link copied!' : 'Copy public link (/journey/:slug)'}</span>
              </div>
            </PrimaryButton>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
