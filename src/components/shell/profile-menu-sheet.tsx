/**
 * 1. Purpose: Displays the 2-choice profile menu popover/sheet (Screen 78a).
 * 2. Spec Ref: Sheet 78a Top-right Profile menu in Stitch UI Design Guide Category G.
 * 3. Called By: TopBar and DesktopTopActions.
 * 4. Calls: BottomSheet, next/link, next/navigation, and Lucide icons.
 */

'use client';

import Link from 'next/link';
import { ChevronRight, Target, User as UserIcon } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { BottomSheet } from '@/components/ui/bottom-sheet';

type ProfileMenuSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
};

export function ProfileMenuSheet({
  isOpen,
  onClose,
  user,
}: Readonly<ProfileMenuSheetProps>) {
  if (!user) return null;

  const displayName =
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Bunon user';
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Account & profile">
      <div className="space-y-4 pt-1">
        {/* User Identity Snippet */}
        <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-secondary-surface/30 p-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1A1A1B] text-base font-semibold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink truncate leading-tight">
              {displayName}
            </p>
            <p className="text-xs text-muted truncate mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* 2 Decided Choices (Screen 78a) */}
        <div className="overflow-hidden rounded-2xl border border-hairline bg-card divide-y divide-hairline">
          {/* Item 1: Profile (Screen 79) */}
          <Link
            href="/profile"
            onClick={onClose}
            className="group flex items-center justify-between p-4 transition-colors hover:bg-secondary-surface/40 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-surface text-ink group-hover:bg-card">
                <UserIcon size={17} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink group-hover:text-muted transition-colors">
                  Profile
                </p>
                <p className="text-xs text-muted">
                  Your identity, bio, and completed chapters
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted group-hover:text-ink transition-colors ml-2" />
          </Link>

          {/* Item 2: Goals and Journey Cards (Screen 85) */}
          <Link
            href="/goals"
            onClick={onClose}
            className="group flex items-center justify-between p-4 transition-colors hover:bg-secondary-surface/40 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-surface text-ink group-hover:bg-card">
                <Target size={17} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink group-hover:text-muted transition-colors">
                  Goals and Journey Cards
                </p>
                <p className="text-xs text-muted">
                  Active milestones, past goals, and public proofs
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted group-hover:text-ink transition-colors ml-2" />
          </Link>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full text-center text-xs text-muted hover:text-ink py-1 transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </BottomSheet>
  );
}
