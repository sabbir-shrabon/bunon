/**
 * 1. Purpose: Displays the Terms & Policy directory (Screen 72) with links to policies.
 * 2. Spec Ref: Screen 72 Terms and policy pages in Stitch UI Design Guide Category G.
 * 3. Called By: Left Drawer, Desktop Sidebar, and footer links.
 * 4. Calls: AppShell, next/link, and Lucide icons.
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, FileCheck, FileText, Shield } from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';

const policyLinks = [
  {
    href: '/privacy',
    title: 'Privacy policy',
    description: 'What data we collect, Singapore storage, and paid Gemini AI privacy.',
    icon: Shield,
  },
  {
    href: '/terms',
    title: 'Terms of use',
    description: 'Adults 18+ eligibility, free Journey Cards, and acceptable use.',
    icon: FileText,
  },
  {
    href: '/refund',
    title: 'Refund policy',
    description: 'Prepaid passes with no auto-renewal and 100% billing-error refund rules.',
    icon: FileCheck,
  },
];

export default function LegalPage() {
  const router = useRouter();

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[640px] px-4 pt-6 pb-24 md:py-8 md:pb-10">
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
            <h1 className="text-xl font-semibold tracking-tight text-ink">Terms and policy</h1>
            <p className="text-xs text-muted">Legal boundaries and transparency for Bunon v2.5</p>
          </div>
        </div>

        {/* 3 Clean Policy Rows */}
        <div className="overflow-hidden rounded-[20px] border border-hairline bg-card shadow-none">
          {policyLinks.map(({ href, title, description, icon: Icon }, index) => (
            <div key={href}>
              <Link
                href={href}
                className="group flex items-center justify-between p-4.5 transition-colors hover:bg-secondary-surface/40"
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-surface text-ink group-hover:bg-card">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-medium text-ink group-hover:text-muted transition-colors">
                      {title}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted leading-relaxed">{description}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="shrink-0 text-muted group-hover:text-ink transition-colors ml-2" />
              </Link>
              {index < policyLinks.length - 1 && <div className="h-[1px] w-full bg-hairline" />}
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-6 rounded-[16px] border border-hairline bg-secondary-surface/50 p-4 text-xs text-muted leading-relaxed">
          Questions about your legal rights or data? You can also message our team through{' '}
          <Link href="/support" className="text-ink underline hover:text-muted">
            Help &amp; support
          </Link>
          .
        </div>
      </div>
    </AppShell>
  );
}
