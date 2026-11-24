/**
 * 1. Purpose: Renders the fixed 250px desktop shell navigation and account footer.
 * 2. Spec Ref: Stitch desktop_web_shell_today_workspace and Desktop Shell 22D.
 * 3. Called By: AppShell.
 * 4. Calls: ThreadLogo, PrimaryNavigation, DrawerLinks, and InviteFriendsSheet.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { ThreadLogo } from '@/components/ui/thread-node';
import { DrawerLinks } from './drawer-links';
import { PrimaryNavigation } from './navigation-links';
import { InviteFriendsSheet } from './invite-friends-sheet';

export function DesktopSidebar({
  user,
  isPro = false,
  proUntil = null,
}: Readonly<{
  user: User | null;
  isPro?: boolean;
  proUntil?: string | null;
}>) {
  const [inviteOpen, setInviteOpen] = useState(false);

  const displayName =
    user?.user_metadata.name ||
    user?.email?.split('@')[0] ||
    'Bunon guest';

  const initial =
    user?.user_metadata.name?.slice(0, 1) ||
    user?.email?.slice(0, 1) ||
    'B';

  return (
    <>
      <aside
        aria-label="Desktop sidebar"
        className="fixed inset-y-0 left-0 z-40 hidden w-[250px] flex-col justify-between border-r border-hairline bg-card md:flex overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="flex h-13 items-center gap-3 border-b border-hairline px-4">
            <ThreadLogo />
            <span className="text-[16px] font-semibold tracking-tight text-ink">
              Bunon
            </span>
          </div>

          {/* Primary Tabs */}
          <div className="px-2 py-1.5">
            <PrimaryNavigation desktop />
          </div>

          {/* Divider */}
          <div className="mx-3 border-t border-hairline" />

          {/* Secondary Links & Preferences */}
          <div className="px-2 py-1">
            <DrawerLinks
              user={user}
              isPro={isPro}
              proUntil={proUntil}
              onOpenInvite={() => setInviteOpen(true)}
            />
          </div>
        </div>

        {/* Account Footer with Direct Profile Link */}
        <div className="px-3 py-2.5 border-t border-hairline bg-card">
          {user ? (
            <Link
              href="/profile"
              className="group flex items-center gap-2.5 p-1 rounded-xl hover:bg-secondary-surface/50 transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1A1A1B] text-white shrink-0 text-[11px] font-semibold">
                {initial.toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-medium text-ink truncate leading-tight group-hover:text-muted transition-colors">
                  {displayName}
                </span>
                <span className="text-[11px] text-muted truncate mt-0.5">
                  View profile
                </span>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2.5 p-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1A1A1B] text-white shrink-0 text-[11px] font-semibold">
                B
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-medium text-ink truncate leading-tight">
                  Bunon guest
                </span>
                <span className="text-[11px] text-muted truncate mt-0.5">
                  Personal workspace
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Sheet 110: Invite Friends Modal */}
      <InviteFriendsSheet
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        user={user}
      />
    </>
  );
}
