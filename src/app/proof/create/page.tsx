/**
 * 1. Purpose: Page entry point for Screen 40 (Create proof) wrapped in Suspense for Next.js prerendering.
 * 2. Spec Ref: Stitch create_proof Screen 40 & Category D Proof.
 * 3. Called By: Next.js App Router for '/proof/create'.
 * 4. Calls: CreateProofView.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createClient } from '@/lib/db/server';
import { createAdminClient } from '@/lib/db/admin';
import { CreateProofView } from '@/components/proof/create-proof-view';

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

  const { data: userData } = await admin
    .from('users')
    .select('pro_until')
    .eq('id', user.id)
    .single();

  const isPro = Boolean(userData?.pro_until && new Date(userData.pro_until) > new Date());

  return (
    <CreateProofView
      key={task.id}
      taskId={task.id}
      taskTitle={task.title}
      isPro={isPro}
    />
  );
}

export default function CreateProofPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--page)] text-muted text-sm">
          Loading camera & proof editor…
        </div>
      }
    >
      <CreateProofContent {...props} />
    </Suspense>
  );
}
