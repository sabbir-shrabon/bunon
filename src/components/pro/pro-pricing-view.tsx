/**
 * 1. Purpose: Displays Bunon Pro prepaid passes with live pricing_plans, Pro expiry status & BDT/USD toggle.
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
import { useAppPreferences } from '@/lib/i18n/app-preferences';
import { formatProExpiryDate, isUserProActive } from '@/lib/auth/entitlement';
import type { PricingPlanRow } from '@/types/db/system-tables';
import type { BunonPlatform } from '@/lib/platform';

interface ProPricingViewProps {
  plans: PricingPlanRow[];
  defaultCurrency: 'BDT' | 'USD';
  platform: BunonPlatform;
  isPro?: boolean;
  proUntil?: string | null;
}

const PRO_BENEFITS = [
  'Up to 3 active goals running concurrently',
  '15–30 second video and PDF/file proofs (up to max file limit)',
  'Unlimited daily photo proofs (up to 2 GB cloud storage)',
  'Up to 4 manual roadmap restructures per month',
  'Free shareable Journey Cards on goal completion',
];

export function ProPricingView({ plans, defaultCurrency, platform, isPro = false, proUntil = null }: ProPricingViewProps) {
  const router = useRouter();
  const { language } = useAppPreferences();
  const [selectedPlan, setSelectedPlan] = useState<string>(
    plans.find((p) => p.is_recommended)?.item_code || plans[0]?.item_code || 'PASS_3M'
  );
  const [currency, setCurrency] = useState<'BDT' | 'USD'>(defaultCurrency);

  const isPlayStore = platform === 'play-store';
  const activePro = Boolean(isPro || isUserProActive(proUntil));
  const formattedExpiry = formatProExpiryDate(proUntil, language);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[640px] px-4 pt-6 pb-24 md:py-8 md:pb-10 space-y-6">
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
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight text-ink">Bunon Pro</h1>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      activePro
                        ? 'bg-[#FFB020]/15 text-ink border border-[#FFB020]/40'
                        : 'bg-secondary-surface text-muted'
                    }`}
                  >
                    {activePro ? 'Pro' : 'Free plan'}
                  </span>
                </div>
              <p className="text-xs text-muted">
                {activePro && formattedExpiry
                  ? `Active Pro pass · Valid until ${formattedExpiry}`
                  : 'Fixed-duration prepaid pass with zero auto-renewal'}
              </p>
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
                    ? 'bg-ink text-white dark:text-[#0E0F11] font-semibold'
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
                    ? 'bg-ink text-white dark:text-[#0E0F11] font-semibold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                USD ($)
              </button>
            </div>
          )}
        </div>

        {/* Active Pro Entitlement Banner */}
        {activePro && (
          <div className="rounded-[20px] border border-[#FFB020]/40 bg-[#FFB020]/10 p-4 md:p-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFB020] text-white">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">
                  Bunon Pro is active
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {formattedExpiry
                    ? `Expires on ${formattedExpiry}. You can top up any pass below to extend your duration.`
                    : 'All Pro features are currently unlocked on your account.'}
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-card border border-[#FFB020]/40 px-2.5 py-0.5 text-[11px] font-semibold text-ink">
              Pro
            </span>
          </div>
        )}

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.item_code;
            const title = language === 'BN' ? plan.title_bn || plan.title_en : plan.title_en;
            const badge =
              language === 'BN'
                ? plan.badge_text_bn || plan.badge_text_en || (plan.is_recommended ? 'সুপারিশকৃত' : null)
                : plan.badge_text_en || (plan.is_recommended ? 'Recommended' : null);
            const usdPrice =
              plan.price_usd !== null && plan.price_usd !== undefined
                ? Number(plan.price_usd).toFixed(2)
                : (Number(plan.price_bdt) / 120).toFixed(2);

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
                  <span className="absolute right-3 top-3 rounded-full bg-ink text-page px-2 py-0.5 text-[10px] font-medium tracking-wide">
                    {badge}
                  </span>
                )}
                <p className="text-sm font-semibold text-ink pr-16">{title}</p>
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
                      {currency === 'BDT' ? `৳${plan.price_bdt}` : `$${usdPrice}`}
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
                activePro
                  ? `Your Bunon Pro pass is active${formattedExpiry ? ` until ${formattedExpiry}` : ''}. Live self-serve pass top-up unlocks in Milestone 6.`
                  : 'Live checkout gateway unlocks in Milestone 6. You can continue using your active Free plan!'
              )
            }
          >
            {isPlayStore
              ? 'Continue with Google Play'
              : activePro
                ? 'Extend Pro pass'
                : 'Continue to payment'}
          </PrimaryButton>
        </div>
      </div>
    </AppShell>
  );
}
