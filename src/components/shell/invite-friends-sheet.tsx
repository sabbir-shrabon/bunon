/**
 * 1. Purpose: Displays referral link, QR code, and 3-task reward details (Sheet 110).
 * 2. Spec Ref: Sheet 110 Invite friends / Referral in Stitch UI Design Guide Category I.
 * 3. Called By: LeftDrawer, DesktopSidebar, and DrawerLinks.
 * 4. Calls: BottomSheet, PrimaryButton, qrcode SVG renderer, and Lucide icons.
 */

'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Gift, Sparkles } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';

type InviteFriendsSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
};

export function InviteFriendsSheet({
  isOpen,
  onClose,
  user,
}: Readonly<InviteFriendsSheetProps>) {
  const [copied, setCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>('');

  const referralCode = user
    ? user.id.replace(/-/g, '').slice(0, 8).toUpperCase()
    : 'BUNON2026';

  const [origin, setOrigin] = useState(
    process.env.NEXT_PUBLIC_APP_URL || 'https://bunon.app'
  );
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const referralUrl = `${origin}/login?ref=${referralCode}`;

  useEffect(() => {
    if (!isOpen) return;
    QRCode.toString(
      referralUrl,
      {
        type: 'svg',
        margin: 1,
        color: {
          dark: '#1A1A1B',
          light: '#FFFFFF',
        },
      },
      (err, svg) => {
        if (!err && svg) {
          setQrSvg(svg);
        }
      }
    );
  }, [isOpen, referralUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Invite friends">
      <div className="space-y-4 pt-1 text-center">
        {/* Header Icon + Explanation */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary-surface text-ink">
          <Gift size={22} />
        </div>

        <div>
          <h3 className="text-base font-semibold text-ink">
            Give Pro days, get Pro days
          </h3>
          <p className="text-xs text-muted max-w-[340px] mx-auto mt-1 leading-relaxed">
            When a friend joins with your link or QR code and completes 3 tasks, you both earn free Pro days.
          </p>
        </div>

        {/* QR Code Container */}
        {qrSvg && (
          <div className="mx-auto flex justify-center p-3 bg-white rounded-2xl border border-hairline w-fit">
            <div
              className="w-36 h-36 [&>svg]:w-full [&>svg]:h-full"
              // SVG rendered by verified qrcode library with internal coordinates
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          </div>
        )}

        {/* Link Box */}
        <div className="flex items-center gap-2 rounded-xl border border-hairline bg-page p-2.5 text-left">
          <input
            type="text"
            readOnly
            value={referralUrl}
            className="flex-1 bg-transparent text-xs text-ink font-mono outline-none truncate selection:bg-secondary-surface"
          />
          <span className="text-[11px] font-semibold text-muted bg-secondary-surface px-2 py-0.5 rounded-full shrink-0">
            {referralCode}
          </span>
        </div>

        {/* Copy Link Button */}
        <div className="space-y-2 pt-1">
          <PrimaryButton onClick={handleCopy}>
            <span className="flex items-center justify-center gap-2">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Link copied' : 'Copy link'}</span>
            </span>
          </PrimaryButton>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-xs text-muted hover:text-ink py-1.5 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
