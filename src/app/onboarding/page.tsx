/**
 * 1. Purpose: Onboarding page entry point with authentication guard and active goal plan limits.
 * 2. Spec Ref: Category B Screens 10–21 in UI Design Guide & Rulebook Section 2.
 * 3. Called By: Navigation from /today or /login.
 * 4. Calls: createClient (Server), OnboardingWizard.
 */

import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import Link from 'next/link';
import { createClient } from '@/lib/db/server';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

async function OnboardingContent() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=%2Fonboarding');
  }

  // Check user subscription & active goal count
  const { data: profile } = await supabase
    .from('users')
    .select('pro_until')
    .eq('id', user.id)
    .single();

  const isPro = Boolean(profile?.pro_until && new Date(profile.pro_until) > new Date());
  const maxGoals = isPro ? 3 : 1;

  const { count: activeGoalCount } = await supabase
    .from('goals')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE');

  const currentCount = activeGoalCount || 0;

  if (currentCount >= maxGoals) {
    return (
      <div className="flex flex-col min-h-screen bg-page text-ink items-center justify-center px-4 py-6 md:py-10">
        <div className="w-full max-w-[580px] p-6 rounded-[20px] bg-card border border-hairline text-center flex flex-col items-center">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Goal limit reached
          </h1>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            {isPro
              ? 'You have reached the maximum of 3 concurrent active goals on Pro. Focus on these or complete one before starting another.'
              : 'The Free plan supports 1 active goal at a time. Complete or archive your current goal, or upgrade to Pro for up to 3 concurrent active goals.'}
          </p>

          <div className="mt-6 w-full flex flex-col gap-3">
            <Link
              href="/today"
              className="h-[52px] w-full rounded-full bg-[#1A1A1B] !text-[#FFFFFF] text-[#FFFFFF] dark:bg-[#EDEEEF] dark:!text-[#0E0F11] dark:text-[#0E0F11] px-5 text-[15px] font-medium transition-all duration-150 hover:opacity-95 active:scale-[0.99] select-none shadow-none flex items-center justify-center cursor-pointer"
            >
              Go to Today
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <OnboardingWizard />;
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page text-muted text-sm">
          Loading wizard...
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
