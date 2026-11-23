/**
 * 1. Purpose: Provides email/password sign-in and account creation with safe return routing.
 * 2. Spec Ref: Stitch sign_in_create_account Screens 1–4 and Frictionless Auth contract.
 * 3. Called By: /login page.
 * 4. Calls: Browser Supabase client, ensure-user endpoint, GoogleButton, ThreadLogo, and Next router.
 */

'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ThreadLogo } from '@/components/ui/thread-node';
import { createClient } from '@/lib/db/client';
import { sanitizeRedirect } from '@/lib/security';
import { GoogleButton } from './google-button';

export function AuthCard() {
  const router = useRouter();
  const params = useSearchParams();
  const next = sanitizeRedirect(params.get('next'), '/today');

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const complete = async (target: string) => {
    await fetch('/api/auth/ensure-user', { method: 'POST' });
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = user
      ? await supabase.from('users').select('birth_year').eq('id', user.id).maybeSingle()
      : { data: null };

    if (profile?.birth_year === null) {
      router.replace(`/setup?next=${encodeURIComponent(target)}`);
    } else {
      router.replace(target);
    }
    router.refresh();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }

    setBusy(true);
    const supabase = createClient();

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
        setBusy(false);
      } else {
        await complete(next);
      }
    } else {
      const callback = `${window.location.origin}/login?next=${encodeURIComponent(next)}`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callback },
      });
      if (error) {
        setMessage(error.message);
        setBusy(false);
      } else if (!data.session) {
        setMessage('Check your email once to confirm your account, then sign in.');
        setBusy(false);
      } else {
        await complete(next);
      }
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-page p-4">
      <section className="w-full max-w-[428px]">
        {/* Navigation / Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => router.back()}
              className="flex h-11 w-11 -ml-2 items-center justify-center text-ink hover:text-muted transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <ThreadLogo />
            <span className="text-[17px] font-semibold tracking-tight text-ink ml-1">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </span>
          </div>
        </div>

        {/* Center Logo & Tagline */}
        <div className="pt-2 pb-4 flex flex-col items-center text-center">
          <ThreadLogo className="h-8 w-8 mb-2" />
          <p className="text-[12px] text-muted tracking-normal">Make every day count</p>
        </div>

        {/* Card */}
        <div className="rounded-[20px] border border-hairline bg-card p-6 shadow-none flex flex-col">
          {/* Segmented Switch */}
          <div className="bg-secondary-surface p-1 rounded-full flex items-center mb-6 border border-hairline">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`py-1.5 px-4 flex-1 text-center rounded-full text-[14px] font-medium transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-card text-ink shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`py-1.5 px-4 flex-1 text-center rounded-full text-[14px] font-medium transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-card text-ink shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Create account
            </button>
          </div>

          {/* Google Button */}
          <GoogleButton
            mode={mode}
            next={next}
            disabled={busy}
            onError={(err) => {
              setMessage(err);
              setBusy(false);
            }}
          />

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-[1px] bg-hairline" />
            <span className="text-[12px] text-muted select-none">or</span>
            <div className="flex-1 h-[1px] bg-hairline" />
          </div>

          {/* Form */}
          <form onSubmit={submit} className="flex flex-col">
            <div className="flex flex-col mb-4">
              <label className="text-[12px] font-medium text-ink mb-1.5 block" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-3 rounded-xl bg-card border border-hairline text-[15px] text-ink placeholder:text-inactive focus:outline-none focus:border-ink"
              />
            </div>

            <div className="flex flex-col mb-1.5">
              <label className="text-[12px] font-medium text-ink mb-1.5 block" htmlFor="password">
                Password
              </label>
              <div className="relative w-full rounded-xl bg-card border border-hairline flex items-center justify-between">
                <input
                  id="password"
                  required
                  minLength={8}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-3 rounded-xl bg-transparent text-[15px] text-ink placeholder:text-inactive focus:outline-none focus:border-ink"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-1 flex items-center justify-center text-muted hover:text-ink transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-1">
              <span className="text-[12px] text-muted">Minimum 8 characters</span>
              {mode === 'signin' && (
                <Link
                  href="/forgot-password"
                  className="text-[12px] text-muted hover:underline transition-all hover:text-ink"
                >
                  Forgot password?
                </Link>
              )}
            </div>

            {message && (
              <p className="mt-4 text-[13px] text-muted" role="status">
                {message}
              </p>
            )}

            <PrimaryButton type="submit" disabled={busy} className="mt-6">
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </PrimaryButton>
          </form>
        </div>

        {/* Footnote */}
        <div className="mt-6 text-center">
          <p className="text-[12px] text-muted leading-relaxed">
            By continuing, you agree to our quiet terms of use and respectful privacy pledge.
          </p>
        </div>
      </section>
    </main>
  );
}
