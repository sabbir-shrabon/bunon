/**
 * 1. Purpose: Displays desktop top actions with notification link and ProfileMenuSheet (78a).
 * 2. Spec Ref: Stitch desktop_web_shell_today_workspace Screen 22D and Sheet 78a.
 * 3. Called By: AppShell.
 * 4. Calls: ProfileMenuSheet, next/link, and Lucide icons.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, User as UserIcon } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { ProfileMenuSheet } from './profile-menu-sheet';

export function DesktopTopActions({
  user,
}: Readonly<{
  user: User | null;
}>) {
  const [profileOpen, setProfileOpen] = useState(false);

  const initial =
    user?.user_metadata.name?.slice(0, 1) ||
    user?.email?.slice(0, 1) ||
    '';

  return (
    <>
      <header className="fixed top-0 left-[250px] right-0 h-14 bg-page/80 backdrop-blur-xl border-b border-hairline z-30 hidden md:flex items-center justify-end px-6 gap-3">
        {user ? (
          <>
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative p-2 rounded-full hover:bg-secondary-surface transition-colors flex items-center justify-center text-muted hover:text-ink cursor-pointer"
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#1A1A1B] ring-2 ring-page" />
            </Link>
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              aria-label="Open profile menu"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1A1B] text-white text-[12px] font-semibold cursor-pointer shrink-0"
            >
              {initial.toUpperCase() || 'U'}
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login?next=%2Ftoday"
              className="text-[14px] font-medium text-muted hover:text-ink transition-colors"
            >
              Sign in
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1A1B] text-white shrink-0">
              <UserIcon size={15} />
            </div>
          </div>
        )}
      </header>

      {/* Sheet 78a: Top-Right Profile Menu */}
      <ProfileMenuSheet
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
      />
    </>
  );
}
