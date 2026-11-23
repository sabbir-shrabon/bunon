/**
 * 1. Purpose: Displays account identity, sign-in provider, and password update form.
 * 2. Spec Ref: Screen 84 Change password and Screen 88 Account in Stitch UI Design Guide.
 * 3. Called By: SettingsView.
 * 4. Calls: Supabase client auth.updateUser, Lucide icons, and PrimaryButton.
 */

'use client';

import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { PrimaryButton } from '@/components/ui/primary-button';
import { createClient } from '@/lib/db/client';

type AccountSectionProps = {
  user: User;
};

export function AccountSection({ user }: Readonly<AccountSectionProps>) {
  const isGoogle = user.app_metadata.provider === 'google';
  const [showForm, setShowForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setUpdating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setSuccessMsg('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
      setShowForm(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Could not update password'
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="rounded-[20px] border border-hairline bg-card p-5 md:p-6 space-y-4 shadow-none">
      <div className="flex items-center justify-between border-b border-hairline pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Account
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-surface px-2.5 py-0.5 text-[11px] font-medium text-ink">
          <ShieldCheck size={13} className="text-muted" />
          <span>{isGoogle ? 'Google Account' : 'Email & Password'}</span>
        </span>
      </div>

      <div className="space-y-3">
        {/* Email Row */}
        <div className="flex items-center justify-between py-1 text-sm">
          <div className="flex items-center gap-2.5 text-muted">
            <Mail size={16} />
            <span>Email address</span>
          </div>
          <span className="font-medium text-ink truncate max-w-[220px]">
            {user.email}
          </span>
        </div>

        {/* Change Password (for Email users only) */}
        {!isGoogle && (
          <div className="border-t border-hairline pt-3">
            {!showForm ? (
              <button
                type="button"
                onClick={() => {
                  setShowForm(true);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="flex items-center gap-2 text-xs font-medium text-ink hover:text-muted transition-colors cursor-pointer"
              >
                <KeyRound size={14} className="text-muted" />
                <span>Change password</span>
              </button>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink">New password</span>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-xs text-muted hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="h-11 w-full rounded-xl border border-hairline bg-page px-3.5 pr-10 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted hover:text-ink cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="h-11 w-full rounded-xl border border-hairline bg-page px-3.5 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-500">{errorMsg}</p>
                )}

                <PrimaryButton type="submit" disabled={updating}>
                  {updating ? 'Updating...' : 'Update password'}
                </PrimaryButton>
              </form>
            )}
          </div>
        )}

        {successMsg && (
          <p className="text-xs text-green-600 dark:text-green-400 pt-1">
            {successMsg}
          </p>
        )}
      </div>
    </div>
  );
}
