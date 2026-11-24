'use client';
/**
 * 1. Purpose: Calm Account Suspended screen (Screen 122) shown when users.status === 'SUSPENDED'.
 * 2. Spec Ref: Stitch UI Design Guide Category I Screen 122.
 * 3. Called By: Authenticated pages and AppShell when account status is SUSPENDED.
 * 4. Calls: /support, /api/account/export, /api/auth/signout.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThreadLogo } from '@/components/ui/thread-node';

export function AccountSuspendedScreen() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/account/export');
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bunon-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch {
      alert('Could not export your data right now. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } finally {
      router.replace('/today');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-page text-ink flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[440px] rounded-[24px] border border-hairline bg-card p-7 md:p-8 text-center flex flex-col items-center shadow-none">
        <div className="mb-5">
          <ThreadLogo />
        </div>

        <h1 className="text-[20px] font-semibold tracking-tight text-ink">
          Your account has been suspended.
        </h1>
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">
          Access to your workspace is paused. If you believe this happened in error or would like to appeal, please reach out to our team.
        </p>

        <div className="mt-6 w-full flex flex-col gap-3">
          <Link
            href="/support"
            className="flex h-[50px] w-full items-center justify-center rounded-full bg-[#1A1A1B] !text-[#FFFFFF] text-[14px] font-medium hover:opacity-95 transition-opacity dark:bg-[#EDEEEF] dark:!text-[#0E0F11]"
          >
            Contact Help &amp; Support
          </Link>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex h-[48px] w-full items-center justify-center rounded-full border border-hairline bg-card text-[14px] font-medium text-ink hover:bg-secondary-surface transition-colors disabled:opacity-50 cursor-pointer"
          >
            {exporting ? 'Exporting my data…' : 'Export my data'}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="mt-1 py-2 text-[13px] font-medium text-muted hover:text-ink transition-colors cursor-pointer"
          >
            {signingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </div>
    </div>
  );
}
