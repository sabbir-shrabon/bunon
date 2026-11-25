import React, { Suspense } from 'react';
/**
 * 1. Purpose: Displays Screen 85 Goals and Journey Cards listing every goal chapter tried.
 * 2. Spec Ref: UI Design Guide Category G Screen 85.
 * 3. Called By: Profile Menu Sheet 78a or LeftDrawer.
 * 4. Calls: createClient (Server), getUserGoals, and AppShell.
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { connection } from 'next/server';
import { createClient } from '@/lib/db/server';
import { getUserGoals } from '@/lib/services/journey-service';
import { getPageAccessState } from '@/lib/services/access-guard.service';
import { AppShell } from '@/components/shell/app-shell';
import { MaintenanceScreen } from '@/components/shell/maintenance-screen';
import { AccountSuspendedScreen } from '@/components/shell/account-suspended-screen';

async function GoalsContent() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=%2Fgoals');
  }

  const { blocked } = await getPageAccessState(user.id);
  if (blocked === 'MAINTENANCE') return <MaintenanceScreen />;
  if (blocked === 'SUSPENDED') return <AccountSuspendedScreen />;
  if (blocked === 'DELETED') redirect('/login?next=%2Fgoals');

  const goals = await getUserGoals(user.id);

  return (
    <AppShell>
      <div className="flex flex-col w-full max-w-[640px] mx-auto px-5 pt-4 pb-24 md:pb-12">
        <h1 className="text-[22px] font-bold text-ink mb-2">Goals &amp; Journey Cards</h1>
        <p className="text-[13.5px] text-muted mb-6">
          Every goal chapter you have started, proven, and accomplished.
        </p>

        {goals.length === 0 ? (
          <div className="p-8 text-center bg-card rounded-[20px] border border-hairline">
            <h2 className="text-[16px] font-semibold text-ink">No goals yet</h2>
            <p className="text-[13px] text-muted mt-1">Start your first goal on Today.</p>
            <Link
              href="/today"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-[#1A1A1B] text-white px-5 text-[13px] font-medium"
            >
              Go to Today
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {goals.map((g) => (
              <article
                key={g.id}
                className="p-5 rounded-[20px] bg-card border border-hairline shadow-none flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-secondary-surface text-[11px] font-medium text-muted mb-1.5">
                      {g.status}
                    </span>
                    <Link
                      href={`/goals/${g.id}`}
                      className="text-[17px] font-bold text-ink hover:underline block"
                    >
                      {g.title}
                    </Link>
                  </div>
                  <Link
                    href={`/timeline?goalId=${g.id}`}
                    className="text-[12px] font-medium text-muted hover:text-ink shrink-0"
                  >
                    View timeline ›
                  </Link>
                </div>

                <div className="text-[13px] text-muted">
                  {g.status === 'COMPLETED' ? (
                    <span className="text-emerald-600 font-medium">Goal Completed 🎓</span>
                  ) : (
                    <span>{g.upcomingMilestonesLeft} milestones left</span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-hairline">
                  {g.journeyCard ? (
                    <Link
                      href={`/journey/${g.journeyCard.public_slug}`}
                      className="px-3.5 py-1.5 rounded-full bg-[#1A1A1B] text-white text-[12px] font-medium hover:opacity-90"
                    >
                      View Journey Card
                    </Link>
                  ) : (
                    <Link
                      href={`/roadmap?goalId=${g.id}`}
                      className="px-3.5 py-1.5 rounded-full bg-secondary-surface text-ink text-[12px] font-medium hover:bg-hairline"
                    >
                      Open Roadmap
                    </Link>
                  )}
                  <Link
                    href={`/goals/${g.id}`}
                    className="px-3.5 py-1.5 rounded-full border border-hairline text-muted text-[12px] font-medium hover:text-ink"
                  >
                    Details &amp; settings
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function GoalsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page text-muted text-sm">
          Loading goals...
        </div>
      }
    >
      <GoalsContent />
    </Suspense>
  );
}
