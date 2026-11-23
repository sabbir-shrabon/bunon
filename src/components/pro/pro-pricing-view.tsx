/**
 * 1. Purpose: Displays Bunon Pro prepaid passes with BDT/USD toggle & Play Store compliance.
 * 2. Spec Ref: Screen 104 Upgrade page in Stitch UI Design Guide Category I & Milestone 5.5.
 * 3. Called By: /pro and /upgrade route pages.
 * 4. Calls: AppShell, PrimaryButton, next/link, next/navigation, Lucide icons.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';
import { PrimaryButton } from '@/components/ui/primary-button';
import type { PricingPlanRow } from '@/types/db/system-tables';
import type { BunonPlatform } from '@/lib/platform';

interface ProPricingViewProps {
  plans: PricingPlanRow[];
  defaultCurrency: 'BDT' | 'USD';
  platform: BunonPlatform;
}

const PRO_BENEFITS = [
  'Up to 3 active goals running concurrently',
  '15–30 second video and PDF/file proofs (10 MB per file)',
  'Multiple daily photo proofs (up to 2 GB cloud storage)',
  'Up to 4 manual roadmap restructures per month',
  'Free shareable Journey Cards on goal completion',
];

export function ProPricingView({
  plans,
  defaultCurrency,
  platform,
}: ProPricingViewProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string>(
    plans.find((p) => p.is_recommended)?.item_code || plans[0]?.item_code || 'PASS_3M'
  );
  const [currency, setCurrency] = useState<'BDT' | 'USD'>(defaultCurrency);

  const isPlayStore = platform === 'play-store';

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[640px] px-4 py-6 md:py-8 space-y-6">
        {/* Header with Title and Currency Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-secondary-surface hover:text-ink transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-ink">
                Bunon Pro
              </h1>
              <p className="text-xs text-muted">Screen 104 · Fixed-duration prepaid pass with zero auto-renewal</p>
            </div>
          </div>

          {/* BDT / USD Currency Toggle Pill (Hidden on Play Store) */}
          {!isPlayStore && (
            <div className="inline-flex self-start sm:self-auto items-center rounded-full bg-secondary-surface p-1 border border-hairline text-xs font-medium">
              <button
                type="button"
                onClick={() => setCurrency('BDT')}
                className={`rounded-full px-3 py-1 cursor-pointer transition-colors ${
                  currency === 'BDT'
                    ? 'bg-ink text-white font-semibold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                BDT (৳)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`rounded-full px-3 py-1 cursor-pointer transition-colors ${
                  currency === 'USD'
                    ? 'bg-ink text-white font-semibold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                USD ($)
              </button>
            </div>
          )}
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.item_code;
            const badge = plan.badge_text_en || (plan.is_recommended ? 'Recommended' : null);

            return (
              <div
                key={plan.item_code}
                onClick={() => setSelectedPlan(plan.item_code)}
                className={`relative rounded-2xl border p-4.5 cursor-pointer transition-colors shadow-none ${
                  isSelected
                    ? 'border-ink bg-card'
                    : 'border-hairline bg-card hover:bg-secondary-surface/30'
                }`}
              >
                {badge && (
                  <span className="absolute right-3 top-3 rounded-full bg-ink text-white px-2 py-0.5 text-[10px] font-medium tracking-wide">
                    {badge}
                  </span>
                )}
                <p className="text-sm font-semibold text-ink">{plan.title_en}</p>
                <p className="text-xs text-muted">{plan.duration_days} days access</p>

                {isPlayStore ? (
                  <div className="mt-3">
                    <span className="inline-block rounded-md bg-secondary-surface px-2 py-1 text-xs font-medium text-ink">
                      Play Store Pass
                    </span>
                    <p className="mt-1 text-[11px] text-muted">Billed via Google Play</p>
                  </div>
                ) : (
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tracking-tight text-ink">
                      {currency === 'BDT'
                        ? `৳${plan.price_bdt}`
                        : `$${plan.price_usd !== null ? plan.price_usd : (plan.price_bdt / 120).toFixed(2)}`}
                    </span>
                    <span className="text-xs text-muted">{currency}</span>
                    {currency === 'BDT' && plan.original_price_bdt && (
                      <span className="text-xs text-muted line-through">
                        ৳{plan.original_price_bdt}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Benefits Card */}
        <div className="rounded-[20px] border border-hairline bg-card p-5 md:p-6 space-y-3.5 shadow-none">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#FFB020]" />
            <h2 className="text-sm font-semibold text-ink">
              Included in Bunon Pro
            </h2>
          </div>
          <ul className="space-y-2.5 text-xs text-muted leading-relaxed">
            {PRO_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5">
                <Check size={14} className="mt-0.5 shrink-0 text-[#FFB020]" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Clear Policy Notice */}
        <div className="rounded-[16px] border border-hairline bg-secondary-surface/40 p-4 text-xs text-muted leading-relaxed">
          <p>
            <strong>Prepaid pass policy:</strong> Bunon passes are fixed duration with zero recurring charges. Purchases are non-refundable except for duplicate charges or system unlock failures within 24 hours. See{' '}
            <Link href="/refund" className="text-ink underline hover:text-muted">
              Refund policy
            </Link>
            .
          </p>
        </div>

        {/* Primary Action */}
        <div className="pt-1">
          <PrimaryButton
            onClick={() =>
              alert(
                'Live checkout gateway unlocks in Milestone 6. You can continue using your active Free plan!'
              )
            }
          >
            {isPlayStore ? 'Continue with Google Play' : 'Continue to payment'}
          </PrimaryButton>
        </div>
      </div>
    </AppShell>
  );
}
