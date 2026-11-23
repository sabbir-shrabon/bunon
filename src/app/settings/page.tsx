/**
 * 1. Purpose: Server page fetching user session and preferences in Suspense for /settings.
 * 2. Spec Ref: Screen 88 Settings (protected by Just-in-Time Auth).
 * 3. Called By: Next.js App Router for '/settings'.
 * 4. Calls: connection, createClient, and SettingsView component.
 */

import { Suspense } from 'react';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/db/server';
import { SettingsView } from '@/components/settings/settings-view';

async function SettingsContent() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/settings');
  }

  const { data: profile } = await supabase
    .from('users')
    .select(
      'id, reminder_time, push_enabled, email_reminders_enabled, theme, language'
    )
    .eq('id', user.id)
    .maybeSingle();

  return <SettingsView user={user} profile={profile} />;
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page text-muted text-sm">
          Loading settings…
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
