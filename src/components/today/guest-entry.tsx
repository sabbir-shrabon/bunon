/**
 * 1. Purpose: Presents the unfenced guest empty state and routes the first-goal action correctly.
 * 2. Spec Ref: Stitch today_guest_entry Screen 22a and Frictionless Auth contract.
 * 3. Called By: Root and /today pages.
 * 4. Calls: AppShell, ThreadKnotIllustration, PrimaryButton, and useAuthSession hook.
 */

'use client';

import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/app-shell';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ThreadKnotIllustration } from '@/components/ui/thread-node';
import { useAuthSession } from '@/components/shell/auth-session';

export function GuestEntry() {
  const router = useRouter();
  const { user } = useAuthSession();

  const handleStartGoal = () => {
    if (user) {
      router.push('/onboarding');
    } else {
      router.push('/login?next=%2Fonboarding');
    }
  };

  return (
    <AppShell>
      <section className="mx-auto flex min-h-[calc(100vh-8.5rem)] w-full max-w-[428px] flex-col items-center justify-center px-4 py-8 md:min-h-[calc(100vh-3.5rem)] md:max-w-[640px]">
        <article className="w-full max-w-[358px] rounded-[20px] border border-hairline bg-card p-6 text-center shadow-none flex flex-col items-center">
          <div className="w-full flex items-center justify-center pt-2">
            <ThreadKnotIllustration />
          </div>

          <h1 className="mt-6 mb-3 text-[20px] font-semibold leading-[26px] tracking-[-0.01em] text-ink text-center">
            Know what to do today. Prove you did it.
          </h1>

          <p className="mb-8 text-[15px] font-normal leading-[21px] text-muted text-center leading-relaxed">
            Tell Bunon one long-term goal. Each week it adapts to your real
            schedule and turns finished steps into a permanent timeline.
          </p>

          <PrimaryButton onClick={handleStartGoal}>
            Start your first goal
          </PrimaryButton>

          <p className="mt-4 text-[12px] font-medium leading-[16px] text-muted text-center">
            {user
              ? 'Free for one goal · Takes about 2 minutes to set up'
              : 'Free for one goal · No sign-in needed to look around'}
          </p>
        </article>
      </section>
    </AppShell>
  );
}
