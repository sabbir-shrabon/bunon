/**
 * 1. Purpose: Collects and locks the one-time adult birth year, country, and language profile gate.
 * 2. Spec Ref: Screens 7–8 18+ Birth-Year Gate and Frictionless Auth contract.
 * 3. Called By: /setup page.
 * 4. Calls: Browser Supabase client, account removal route, and Next router.
 */

'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PrimaryButton } from '@/components/ui/primary-button';
import { createClient } from '@/lib/db/client';
import { sanitizeRedirect } from '@/lib/security';

export function SetupCard() {
  const router = useRouter();
  const params = useSearchParams();
  const next = sanitizeRedirect(params.get('next'), '/today');

  const [birthYear, setBirthYear] = useState('');
  const [country, setCountry] = useState('BD');
  const [language, setLanguage] = useState<'EN' | 'BN'>('EN');
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      await fetch('/api/auth/ensure-user', { method: 'POST' });
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login?next=%2Fsetup');
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('birth_year, country, language')
        .eq('id', user.id)
        .maybeSingle();

      if (data?.birth_year) {
        setBirthYear(String(data.birth_year));
        setCountry(data.country || 'BD');
        setLanguage(data.language || 'EN');
        setLocked(true);
      }
    };

    void load();
  }, [router]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locked) {
      router.replace(next);
      return;
    }

    const year = Number(birthYear);
    const currentYear = new Date().getFullYear();

    if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
      setMessage('Enter a valid 4-digit birth year.');
      return;
    }

    if (!country.trim()) {
      setMessage('Choose your country.');
      return;
    }

    setBusy(true);

    if (currentYear - year < 18) {
      const response = await fetch('/api/auth/delete-account', { method: 'POST' });
      if (response.ok) {
        router.replace('/under-18');
      } else {
        setMessage('We could not remove this account. Please try again.');
      }
      setBusy(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = user
      ? await supabase
          .from('users')
          .update({
            birth_year: year,
            country: country.trim().toUpperCase().slice(0, 4),
            language,
          })
          .eq('id', user.id)
      : { error: new Error('Please sign in again.') };

    if (error) {
      setMessage(error.message);
    } else {
      router.replace(next);
      router.refresh();
    }
    setBusy(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-page p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-[428px] rounded-[20px] border border-hairline bg-card p-6 shadow-none flex flex-col"
      >
        <p className="text-[12px] font-medium text-muted">A small one-time setup</p>
        <h1 className="mt-1 text-[20px] font-semibold leading-[26px] tracking-tight text-ink">
          Before you begin
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Bunon is for adults. Your birth year is saved once and cannot be changed.
        </p>

        <label className="mt-6 block text-[12px] font-medium text-ink">
          Birth year
          <input
            required
            disabled={locked}
            inputMode="numeric"
            value={birthYear}
            onChange={(event) =>
              setBirthYear(event.target.value.replace(/\D/g, '').slice(0, 4))
            }
            placeholder="e.g. 1998"
            className="mt-1.5 h-12 w-full rounded-xl border border-hairline bg-card px-4 text-[15px] text-ink outline-none placeholder:text-inactive focus:border-ink disabled:bg-secondary-surface"
          />
        </label>

        <label className="mt-4 block text-[12px] font-medium text-ink">
          Country
          <input
            required
            disabled={locked}
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            placeholder="Country code, e.g. BD"
            className="mt-1.5 h-12 w-full rounded-xl border border-hairline bg-card px-4 text-[15px] text-ink outline-none placeholder:text-inactive focus:border-ink disabled:bg-secondary-surface"
          />
        </label>

        <label className="mt-4 block text-[12px] font-medium text-ink">
          Language
          <select
            disabled={locked}
            value={language}
            onChange={(event) => setLanguage(event.target.value as 'EN' | 'BN')}
            className="mt-1.5 h-12 w-full rounded-xl border border-hairline bg-card px-4 text-[15px] text-ink outline-none disabled:bg-secondary-surface cursor-pointer"
          >
            <option value="EN" className="bg-card text-ink">English</option>
            <option value="BN" className="bg-card text-ink">বাংলা</option>
          </select>
        </label>

        {message && (
          <p className="mt-4 text-[13px] text-muted" role="status">
            {message}
          </p>
        )}

        <PrimaryButton disabled={busy} className="mt-6">
          {busy ? 'Please wait…' : locked ? 'Continue' : 'Save and continue'}
        </PrimaryButton>
      </form>
    </main>
  );
}
