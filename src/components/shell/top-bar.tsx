/**
 * 1. Purpose: Renders the mobile Bunon bar with drawer, notices, and ProfileMenuSheet.
 * 2. Spec Ref: Stitch guest entry screen, Navigation Drawer 69, and Sheet 78a.
 * 3. Called By: AppShell.
 * 4. Calls: ThreadLogo, ProfileMenuSheet, next/link, and Lucide icons.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Menu, User as UserIcon } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { ThreadLogo } from '@/components/ui/thread-node';
import { ProfileMenuSheet } from './profile-menu-sheet';

export function TopBar({
  user,
  onOpenDrawer,
}: Readonly<{
  user: User | null;
  onOpenDrawer: () => void;
}>) {
  const [profileOpen, setProfileOpen] = useState(false);

  const initial =
    user?.user_metadata.name?.slice(0, 1) ||
    user?.email?.slice(0, 1) ||
    '';

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-hairline bg-card/80 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] md:hidden">
        <div className="mx-auto flex h-14 max-w-[428px] items-center justify-between px-4">
          <button
            type="button"
            aria-label="Navigation menu"
            className="-ml-2 flex h-11 w-11 items-center justify-center text-ink hover:text-muted transition-colors cursor-pointer"
            onClick={onOpenDrawer}
          >
            <Menu size={22} />
          </button>

          <div className="flex items-center gap-2">
            <ThreadLogo />
            <span className="text-[17px] font-semibold tracking-tight text-ink">
              Bunon
            </span>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/notifications"
                aria-label="Notifications"
                className="relative flex h-11 w-11 items-center justify-center text-ink hover:text-muted transition-colors cursor-pointer"
              >
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#1A1A1B]" />
              </Link>
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                aria-label="Open profile menu"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1A1B] text-[12px] font-semibold text-white shrink-0 cursor-pointer"
              >
                {initial.toUpperCase() || 'U'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login?next=%2Ftoday"
                className="flex min-h-[44px] items-center text-[14px] font-medium text-muted hover:text-ink transition-colors"
              >
                Sign in
              </Link>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1A1B] text-white shrink-0">
                <UserIcon size={16} />
              </div>
            </div>
          )}
        </div>
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
