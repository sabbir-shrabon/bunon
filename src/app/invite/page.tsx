/**
 * 1. Purpose: Direct route for inviting friends, sharing referral link and QR code (Sheet 110).
 * 2. Spec Ref: Sheet 110 Invite friends / Referral in Stitch UI Design Guide Category I.
 * 3. Called By: Next.js App Router for '/invite'.
 * 4. Calls: AppShell, QRCode SVG renderer, PrimaryButton, and Lucide icons.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { ArrowLeft, Check, Copy, Gift } from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useAuthSession } from '@/components/shell/auth-session';

export default function InvitePage() {
  const router = useRouter();
  const { user } = useAuthSession();
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
  }, [referralUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[640px] px-4 pt-6 pb-24 md:py-8 md:pb-10 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-secondary-surface hover:text-ink transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              Invite friends
            </h1>
            <p className="text-xs text-muted">Sheet 110 · Earn free Pro days together</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-[24px] border border-hairline bg-card p-6 md:p-8 text-center space-y-5 shadow-none">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary-surface text-ink">
            <Gift size={24} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-ink">
              Give Pro days, get Pro days
            </h2>
            <p className="text-sm text-muted max-w-[380px] mx-auto mt-1 leading-relaxed">
              When a friend joins with your link or QR code and completes 3 tasks, you both earn free Pro days.
            </p>
          </div>

          {/* QR Code */}
          {qrSvg && (
            <div className="mx-auto flex justify-center p-3 bg-white rounded-2xl border border-hairline w-fit">
              <div
                className="w-40 h-40 [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            </div>
          )}

          {/* Link box */}
          <div className="flex items-center gap-2 rounded-xl border border-hairline bg-page p-3 text-left">
            <input
              type="text"
              readOnly
              value={referralUrl}
              className="flex-1 bg-transparent text-xs text-ink font-mono outline-none truncate"
            />
            <span className="text-xs font-semibold text-muted bg-secondary-surface px-2.5 py-1 rounded-full shrink-0">
              {referralCode}
            </span>
          </div>

          <div className="pt-2">
            <PrimaryButton onClick={handleCopy}>
              <span className="flex items-center justify-center gap-2">
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Link copied' : 'Copy link'}</span>
              </span>
            </PrimaryButton>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
