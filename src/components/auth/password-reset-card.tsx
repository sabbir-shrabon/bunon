/**
 * 1. Purpose: Handles standard Supabase password reset email and new-password completion flows.
 * 2. Spec Ref: Screens 5–6 Password Reset and Frictionless Auth contract.
 * 3. Called By: Forgot-password and reset-password routes.
 * 4. Calls: Browser Supabase client, PrimaryButton, and Next router.
 */

'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/primary-button';
import { createClient } from '@/lib/db/client';

export function PasswordResetCard({
  reset = false,
}: Readonly<{
  reset?: boolean;
}>) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    const supabase = createClient();

    if (reset) {
      if (value.length < 8) {
        setMessage('Password must be at least 8 characters.');
        setBusy(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: value });
      if (error) {
        setMessage(error.message);
      } else {
        router.replace('/login');
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(value, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setMessage(
        error ? error.message : 'Check your email for a secure reset link.'
      );
    }
    setBusy(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-page p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-[428px] rounded-[20px] border border-hairline bg-card p-6 shadow-none flex flex-col"
      >
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted hover:text-ink transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          <span>Back to sign in</span>
        </Link>

        <h1 className="mt-4 text-[20px] font-semibold leading-[26px] tracking-tight text-ink">
          {reset ? 'Set a new password' : 'Reset your password'}
        </h1>

        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          {reset
            ? 'Choose a password with at least 8 characters.'
            : 'We will email you a secure link to continue.'}
        </p>

        <label className="mt-6 block text-[12px] font-medium text-ink">
          {reset ? 'New password' : 'Email'}
          <input
            required
            type={reset ? 'password' : 'email'}
            minLength={reset ? 8 : undefined}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={reset ? 'Minimum 8 characters' : 'you@example.com'}
            className="mt-1.5 h-12 w-full rounded-xl border border-hairline bg-card px-4 text-[15px] text-ink outline-none placeholder:text-inactive focus:border-ink"
          />
        </label>

        {message && (
          <p className="mt-4 text-[13px] text-muted" role="status">
            {message}
          </p>
        )}

        <PrimaryButton disabled={busy} className="mt-6">
          {busy ? 'Please wait…' : reset ? 'Save new password' : 'Email reset link'}
        </PrimaryButton>
      </form>
    </main>
  );
}
