/**
 * 1. Purpose: Main scrolling settings page container combining all settings categories.
 * 2. Spec Ref: Screen 88 Settings in Stitch UI Design Guide Category G.
 * 3. Called By: /settings Page.
 * 4. Calls: AppShell, AccountSection, NotificationsSection, PrivacySection, AboutSection, LogoutSheet.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { AppShell } from '@/components/shell/app-shell';
import { AccountSection } from './account-section';
import { NotificationsSection } from './notifications-section';
import { PrivacySection } from './privacy-section';
import { AboutSection } from './about-section';
import { LogoutSheet } from './logout-sheet';
import type { UserRow } from '@/types/database';

type SettingsViewProps = {
  user: User;
  profile: Partial<UserRow> | null;
};

export function SettingsView({
  user,
  profile,
}: Readonly<SettingsViewProps>) {
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[640px] px-4 pt-6 pb-24 md:py-8 md:pb-10 space-y-6">
        {/* Header with Back Arrow */}
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
              Settings
            </h1>
            <p className="text-xs text-muted">Screen 88 · Account, reminders, and data controls</p>
          </div>
        </div>

        {/* 1. Account Section (Screen 84) */}
        <AccountSection user={user} />

        {/* 2. Reminders & Notifications (Screen 89) */}
        <NotificationsSection
          initialTime={profile?.reminder_time || '08:00:00'}
          initialPush={profile?.push_enabled ?? true}
          initialEmail={profile?.email_reminders_enabled ?? false}
        />

        {/* 3. Privacy & Data (Screens 90–92) */}
        <PrivacySection />

        {/* 4. About & AI Notice (Screen 93) */}
        <AboutSection />

        {/* 5. Log Out Row (Sheet 94) */}
        <div className="rounded-[20px] border border-hairline bg-card p-4.5 flex items-center justify-between shadow-none">
          <div>
            <h2 className="text-sm font-medium text-ink">Sign out of session</h2>
            <p className="text-xs text-muted">End your authenticated session on this browser</p>
          </div>
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-hairline bg-card px-4 py-2 text-xs font-medium text-ink hover:bg-secondary-surface transition-colors cursor-pointer"
          >
            <LogOut size={14} className="text-muted" />
            <span>Log out</span>
          </button>
        </div>

        {/* Modal: Sheet 94 */}
        <LogoutSheet
          isOpen={logoutOpen}
          onClose={() => setLogoutOpen(false)}
        />
      </div>
    </AppShell>
  );
}
