'use client';
/**
 * 1. Purpose: Calm Maintenance screen (Screen 118) shown when system_settings.full_maintenance_mode is true.
 * 2. Spec Ref: Database Schema v2.5 Table 22 (full_maintenance_mode) & Screen 118.
 * 3. Called By: Authenticated pages and AppShell during full maintenance mode.
 * 4. Calls: ThreadLogo.
 */

import Link from 'next/link';
import { ThreadLogo } from '@/components/ui/thread-node';

export function MaintenanceScreen() {
  return (
    <div className="min-h-screen bg-page text-ink flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[440px] rounded-[24px] border border-hairline bg-card p-7 md:p-8 text-center flex flex-col items-center shadow-none">
        <div className="mb-5">
          <ThreadLogo />
        </div>

        <h1 className="text-[20px] font-semibold tracking-tight text-ink">
          Bunon is taking a brief pause
        </h1>
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">
          We are performing quick maintenance to keep things calm and reliable. Your goals, tasks, and proofs are safely preserved.
        </p>

        <div className="mt-6 w-full flex flex-col gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex h-[50px] w-full items-center justify-center rounded-full bg-[#1A1A1B] !text-[#FFFFFF] text-[14px] font-medium hover:opacity-95 transition-opacity dark:bg-[#EDEEEF] dark:!text-[#0E0F11] cursor-pointer"
          >
            Check again
          </button>
          <Link
            href="/legal"
            className="py-1.5 text-[12.5px] text-muted hover:text-ink transition-colors"
          >
            Terms &amp; privacy
          </Link>
        </div>
      </div>
    </div>
  );
}
