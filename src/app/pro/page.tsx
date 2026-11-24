/**
 * 1. Purpose: Server Component loading pricing plans, regional currency, Pro status & platform in Suspense.
 * 2. Spec Ref: Screen 104 Pro Upgrade page in Stitch UI Design Guide Category I & Milestone 5.5.
 * 3. Called By: Next.js App Router for '/pro' and '/upgrade'.
 * 4. Calls: connection, createAdminClient, createClient, getPageAccessState, usePlatform, ProPricingView.
 */

import { Suspense } from 'react';
import { connection } from 'next/server';
import { createAdminClient } from '@/lib/db/admin';
import { createClient } from '@/lib/db/server';
import { usePlatform } from '@/lib/platform';
import { getPageAccessState } from '@/lib/services/access-guard.service';
import { ProPricingView } from '@/components/pro/pro-pricing-view';
import { MaintenanceScreen } from '@/components/shell/maintenance-screen';
import { AccountSuspendedScreen } from '@/components/shell/account-suspended-screen';
import type { PricingPlanRow } from '@/types/db/system-tables';

const FALLBACK_PLANS: PricingPlanRow[] = [
  {
    item_code: 'PASS_1M',
    title_en: '1-Month Pro Pass',
    title_bn: '১ মাসের প্রো পাস',
    price_bdt: 149,
    price_usd: 1.99,
    original_price_bdt: null,
    badge_text_en: null,
    badge_text_bn: null,
    promo_starts_at: null,
    promo_ends_at: null,
    duration_days: 30,
    is_recommended: false,
  },
  {
    item_code: 'PASS_3M',
    title_en: '3-Month Pro Pass',
    title_bn: '৩ মাসের প্রো পাস',
    price_bdt: 349,
    price_usd: 4.99,
    original_price_bdt: 447,
    badge_text_en: 'Most Popular',
    badge_text_bn: 'সবচেয়ে জনপ্রিয়',
    promo_starts_at: null,
    promo_ends_at: null,
    duration_days: 90,
    is_recommended: true,
  },
  {
    item_code: 'PASS_6M',
    title_en: '6-Month Pro Pass',
    title_bn: '৬ মাসের প্রো পাস',
    price_bdt: 599,
    price_usd: 7.99,
    original_price_bdt: 894,
    badge_text_en: null,
    badge_text_bn: null,
    promo_starts_at: null,
    promo_ends_at: null,
    duration_days: 180,
    is_recommended: false,
  },
  {
    item_code: 'PASS_12M',
    title_en: '12-Month Pro Pass',
    title_bn: '১২ মাসের প্রো পাস',
    price_bdt: 999,
    price_usd: 12.99,
    original_price_bdt: 1788,
    badge_text_en: 'Best Value',
    badge_text_bn: 'সেরা মান',
    promo_starts_at: null,
    promo_ends_at: null,
    duration_days: 365,
    is_recommended: false,
  },
];

async function ProPageContent() {
  await connection();
  const platform = await usePlatform();
  const admin = createAdminClient();

  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // Guest or unauthenticated access
  }

  const [{ blocked, profile }, { data: dbPlans }] = await Promise.all([
    getPageAccessState(userId),
    admin.from('pricing_plans').select('*').order('duration_days', { ascending: true }),
  ]);

  if (blocked === 'MAINTENANCE') return <MaintenanceScreen />;
  if (blocked === 'SUSPENDED') return <AccountSuspendedScreen />;

  const plans = (
    dbPlans && dbPlans.length > 0 ? dbPlans : FALLBACK_PLANS
  ) as unknown as PricingPlanRow[];

  const userCountry = (profile?.country || 'BD').toUpperCase();
  const defaultCurrency: 'BDT' | 'USD' = userCountry === 'BD' ? 'BDT' : 'USD';

  return (
    <ProPricingView
      plans={plans}
      defaultCurrency={defaultCurrency}
      platform={platform}
      isPro={profile?.isPro ?? false}
      proUntil={profile?.pro_until ?? null}
    />
  );
}

export default function ProPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--page)] text-muted text-sm">
          Loading Bunon Pro…
        </div>
      }
    >
      <ProPageContent />
    </Suspense>
  );
}
