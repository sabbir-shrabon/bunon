/**
 * 1. Purpose: Displays the mobile Drawer 69 above a neutral, dismissible scrim.
 * 2. Spec Ref: Stitch navigation_drawer screen and UI Design Guide Left Drawer 69.
 * 3. Called By: AppShell.
 * 4. Calls: ThreadLogo, DrawerLinks, and InviteFriendsSheet.
 */

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { ThreadLogo } from '@/components/ui/thread-node';
import { DrawerLinks } from './drawer-links';
import { InviteFriendsSheet } from './invite-friends-sheet';

export function LeftDrawer({
  open,
  user,
  onClose,
}: Readonly<{
  open: boolean;
  user: User | null;
  onClose: () => void;
}>) {
  const [inviteOpen, setInviteOpen] = useState(false);

  if (!open) return null;

  const displayName =
    user?.user_metadata.name ||
    user?.email?.split('@')[0] ||
    'Bunon guest';

  const subtitle = user ? user.email : 'A quiet place to begin';

  return (
    <>
      <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
        {/* Neutral Scrim */}
        <button
          type="button"
          aria-label="Close navigation"
          className="absolute inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity cursor-default"
          onClick={onClose}
        />

        {/* Drawer Panel */}
        <aside
          aria-label="Navigation drawer"
          className="relative z-10 flex h-full w-[300px] flex-col justify-between bg-card p-5 shadow-xl transition-transform duration-300 ease-out overflow-y-auto"
        >
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <ThreadLogo />
                <span className="text-[17px] font-semibold tracking-tight text-ink">
                  Bunon
                </span>
              </div>
              <button
                type="button"
                aria-label="Close navigation"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-secondary-surface hover:text-ink transition-colors cursor-pointer"
                onClick={onClose}
              >
                <X size={18} />
              </button>
            </div>

            {/* Identity Snippet */}
            <div className="pb-4 pt-1">
              <p className="text-[14px] font-medium text-ink leading-tight">
                {displayName}
              </p>
              <p className="text-[12px] text-muted truncate mt-0.5">
                {subtitle}
              </p>
            </div>

            {/* Divider */}
            <div className="h-[1px] w-full bg-hairline mb-1" />

            {/* Navigation Links */}
            <DrawerLinks
              user={user}
              onNavigate={onClose}
              onOpenInvite={() => setInviteOpen(true)}
            />
          </div>
        </aside>
      </div>

      {/* Sheet 110: Invite Friends Modal */}
      <InviteFriendsSheet
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        user={user}
      />
    </>
  );
}
