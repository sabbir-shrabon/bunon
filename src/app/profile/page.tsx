/**
 * 1. Purpose: Server page fetching owner profile data and completed chapters count in Suspense.
 * 2. Spec Ref: Screen 79 Profile (Facebook-style) in Stitch UI Design Guide Category G.
 * 3. Called By: Next.js App Router for '/profile'.
 * 4. Calls: connection, createClient, and ProfileView component.
 */

import { Suspense } from 'react';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/db/server';
import { getPageAccessState } from '@/lib/services/access-guard.service';
import { ProfileView } from '@/components/profile/profile-view';
import { MaintenanceScreen } from '@/components/shell/maintenance-screen';
import { AccountSuspendedScreen } from '@/components/shell/account-suspended-screen';

async function ProfileContent() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/profile');
  }

  const { blocked } = await getPageAccessState(user.id);
  if (blocked === 'MAINTENANCE') return <MaintenanceScreen />;
  if (blocked === 'SUSPENDED') return <AccountSuspendedScreen />;
  if (blocked === 'DELETED') redirect('/login?next=/profile');

  // 1. Fetch user profile from public.users
  const { data: profile } = await supabase
    .from('users')
    .select(
      'id, name, email, avatar_url, bio, city_country, work_study_role, streak_count, created_at'
    )
    .eq('id', user.id)
    .maybeSingle();

  // 2. Fetch completed chapters count
  const { count: completedChapters } = await supabase
    .from('goals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'COMPLETED');

  return (
    <ProfileView
      user={user}
      profile={profile}
      completedChapters={completedChapters ?? 0}
    />
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page text-muted text-sm">
          Loading profile…
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
