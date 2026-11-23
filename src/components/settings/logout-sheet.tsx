/**
 * 1. Purpose: Log out confirmation modal (Sheet 94) terminating session to /today.
 * 2. Spec Ref: Sheet 94 Log out confirmation in Stitch UI Design Guide Category G.
 * 3. Called By: SettingsView.
 * 4. Calls: BottomSheet, /api/auth/signout, and next/navigation.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';

type LogoutSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function LogoutSheet({ isOpen, onClose }: Readonly<LogoutSheetProps>) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      onClose();
      router.replace('/today');
      router.refresh();
    } catch {
      alert('Could not sign out. Please try again.');
      setSigningOut(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Log out">
      <div className="space-y-4 pt-1">
        <div className="flex items-center gap-3 rounded-xl border border-hairline bg-secondary-surface/40 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-ink">
            <LogOut size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">
              Log out of Bunon?
            </h3>
            <p className="text-xs text-muted mt-0.5 leading-relaxed">
              Your goals, daily tasks, and uploaded proofs remain safe. You can sign in anytime.
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <PrimaryButton onClick={handleSignOut} disabled={signingOut}>
            {signingOut ? 'Signing out...' : 'Log out'}
          </PrimaryButton>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-xs text-muted hover:text-ink py-1.5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
