/**
 * 1. Purpose: Displays Bunon's ready-to-publish Refund Policy (Screen 75).
 * 2. Spec Ref: Section 5.3 of bunon_master_product_build_plan_version_2_5.md (Screen 75).
 * 3. Called By: /legal directory and footer policy links.
 * 4. Calls: AppShell, next/link, and Lucide icons.
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';

export default function RefundPolicyPage() {
  const router = useRouter();

  return (
    <AppShell>
      <article className="mx-auto w-full max-w-[640px] px-4 pt-6 pb-24 md:py-8 md:pb-10">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-secondary-surface hover:text-ink transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">Refund Policy</h1>
            <p className="text-xs text-muted">Screen 75 · Effective Date: November 13, 2026</p>
          </div>
        </div>

        {/* Policy Content Card */}
        <div className="rounded-[20px] border border-hairline bg-card p-6 md:p-8 space-y-6 text-sm leading-relaxed text-ink shadow-none">
          <section>
            <h2 className="text-base font-semibold text-ink mb-2">1. Prepaid Passes — No Auto-Renewal</h2>
            <p className="text-muted leading-relaxed">
              Effective Date: November 13, 2026. Bunon Pro passes (1 Month, 3 Months, 6 Months, and 12 Months) are prepaid, fixed-duration purchases (Journey Cards are free for all users). Bunon never auto-renews your pass or charges your wallet or card automatically.
            </p>
          </section>

          <div className="h-[1px] w-full bg-hairline" />

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">2. General Non-Refundable Rule</h2>
            <p className="text-muted leading-relaxed">
              Because Bunon immediately provisions cloud storage and paid AI planning capacity for your account, all purchases are final and strictly non-refundable for change of mind, unused time, or deciding to pause or abandon a goal.
            </p>
          </section>

          <div className="h-[1px] w-full bg-hairline" />

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">3. The Two Billing-Error Exceptions (100% Refunded)</h2>
            <p className="text-muted leading-relaxed mb-3">
              We issue a full refund in Bangladeshi Taka (BDT) under two specific billing-error situations:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-muted leading-relaxed">
              <li>
                <strong className="text-ink">Duplicate Charge:</strong> You were accidentally charged twice for the exact same Pro pass.
              </li>
              <li>
                <strong className="text-ink">System Unlock Failure Over 24 Hours:</strong> Your payment was successfully deducted from your bKash, Nagad, or card account, but Bunon Pro was not unlocked within 24 hours due to a system or verification error.
              </li>
            </ol>
          </section>

          <div className="h-[1px] w-full bg-hairline" />

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">4. How to Request a Billing-Error Refund</h2>
            <p className="text-muted leading-relaxed mb-3">
              To request a refund under either exception above:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted leading-relaxed">
              <li>
                Open the Left Drawer &rarr; tap &ldquo;Pro&rdquo; (Pro status &amp; receipts) &rarr; click &ldquo;Request billing-error refund&rdquo; next to the payment (or contact us via Help &amp; Support).
              </li>
              <li>
                Select the billing-error reason and provide your gateway / bKash / Nagad Transaction ID.
              </li>
              <li>
                Our team reviews all billing-error requests within 48 hours and processes approved refunds back to your original payment method.
              </li>
            </ul>
          </section>

          <div className="h-[1px] w-full bg-hairline" />

          <section>
            <p className="text-xs text-muted leading-relaxed">
              Need assistance? Visit{' '}
              <Link href="/support" className="text-ink underline hover:text-muted">
                Help &amp; support
              </Link>{' '}
              to reach our support team anytime.
            </p>
          </section>
        </div>
      </article>
    </AppShell>
  );
}
