/**
 * 1. Purpose: Displays Dedicated Page 50a (What Bunon Knows) with horizontal goal tabs.
 * 2. Spec Ref: Stitch what_bunon_knows & Page 50a in UI Design Guide.
 * 3. Called By: Next.js App Router for '/what-bunon-knows'.
 * 4. Calls: getWhatBunonKnows service, WhatBunonKnowsView.
 */

import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createClient } from '@/lib/db/server';
import { getWhatBunonKnows } from '@/lib/services/context-service';
import { WhatBunonKnowsView } from '@/components/what-bunon-knows/what-bunon-knows-view';

interface PageProps {
  searchParams: Promise<{ goalId?: string }>;
}

async function WhatBunonKnowsContent({ searchParams }: PageProps) {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=%2Fwhat-bunon-knows');
  }

  const { goalId } = await searchParams;
  const initialData = await getWhatBunonKnows(user.id, goalId);

  return <WhatBunonKnowsView initialData={initialData} />;
}

export default function WhatBunonKnowsPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--surface-canvas)] text-[var(--ink-muted)] text-sm">
          Loading What Bunon Knows...
        </div>
      }
    >
      <WhatBunonKnowsContent {...props} />
    </Suspense>
  );
}
