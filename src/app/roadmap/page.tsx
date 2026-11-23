import React, { Suspense } from 'react';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/db/server';
import { getRoadmapData } from '@/lib/services/roadmap-service';
import { RoadmapView } from '@/components/roadmap/roadmap-view';

async function RoadmapContent({
  searchParams,
}: {
  searchParams: Promise<{ goalId?: string }>;
}) {
  await connection();
  const { goalId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=%2Froadmap');
  }

  const data = await getRoadmapData(user.id, goalId);

  return (
    <RoadmapView
      goal={data.goal}
      milestones={data.milestones}
      allGoals={data.allGoals}
    />
  );
}

export default async function RoadmapPage(props: {
  searchParams: Promise<{ goalId?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page text-muted text-sm">
          Loading roadmap...
        </div>
      }
    >
      <RoadmapContent searchParams={props.searchParams} />
    </Suspense>
  );
}
