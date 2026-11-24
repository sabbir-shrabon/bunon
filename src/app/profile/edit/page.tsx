/**
 * 1. Purpose: Server page fetching existing profile data in Suspense for EditProfileView.
 * 2. Spec Ref: Screen 80 Edit profile in Stitch UI Design Guide Category G.
 * 3. Called By: Next.js App Router for '/profile/edit'.
 * 4. Calls: connection, createClient, and EditProfileView component.
 */

import { Suspense } from 'react';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/db/server';
import { getPageAccessState } from '@/lib/services/access-guard.service';
import { EditProfileView } from '@/components/profile/edit-profile-view';
import { MaintenanceScreen } from '@/components/shell/maintenance-screen';
import { AccountSuspendedScreen } from '@/components/shell/account-suspended-screen';

async function EditProfileContent() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/profile/edit');
  }

  const { blocked } = await getPageAccessState(user.id);
  if (blocked === 'MAINTENANCE') return <MaintenanceScreen />;
  if (blocked === 'SUSPENDED') return <AccountSuspendedScreen />;
  if (blocked === 'DELETED') redirect('/login?next=/profile/edit');

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, bio, city_country, work_study_role, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  return <EditProfileView user={user} profile={profile} />;
}

export default function EditProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page text-muted text-sm">
          Loading edit profile…
        </div>
      }
    >
      <EditProfileContent />
    </Suspense>
  );
}
