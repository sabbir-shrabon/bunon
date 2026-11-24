/**
 * 1. Purpose: Page entry point for Screen 40 (Create proof) wrapped in Suspense for Next.js prerendering.
 * 2. Spec Ref: Stitch create_proof Screen 40 & Category D Proof.
 * 3. Called By: Next.js App Router for '/proof/create'.
 * 4. Calls: CreateProofView, getPageAccessState.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createClient } from '@/lib/db/server';
import { createAdminClient } from '@/lib/db/admin';
import { getPageAccessState } from '@/lib/services/access-guard.service';
import { CreateProofView } from '@/components/proof/create-proof-view';
import { MaintenanceScreen } from '@/components/shell/maintenance-screen';
import { AccountSuspendedScreen } from '@/components/shell/account-suspended-screen';

interface PageProps {
  searchParams: Promise<{ taskId?: string }>;
}

async function CreateProofContent({ searchParams }: PageProps) {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/today');
  }

  const { blocked, profile, settings } = await getPageAccessState(user.id);
  if (blocked === 'MAINTENANCE') return <MaintenanceScreen />;
  if (blocked === 'SUSPENDED') return <AccountSuspendedScreen />;
  if (blocked === 'DELETED') redirect('/login?next=/today');

  const { taskId } = await searchParams;
  if (!taskId) {
    redirect('/today');
  }

  const admin = createAdminClient();
  const { data: task } = await admin
    .from('tasks')
    .select('id, title, goal_id')
    .eq('id', taskId)
    .single();

  if (!task) {
    redirect('/today');
  }

  return (
    <CreateProofView
      key={task.id}
      taskId={task.id}
      taskTitle={task.title}
      isPro={profile?.isPro ?? false}
      maxFileSizeBytes={settings.max_file_size_bytes}
      maxVideoDurationSeconds={settings.max_video_duration_seconds}
    />
  );
}

export default function CreateProofPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--page)] text-muted text-sm">
          Loading camera &amp; proof editor…
        </div>
      }
    >
      <CreateProofContent {...props} />
    </Suspense>
  );
}
