/**
 * 1. Purpose: Displays Bunon's ready-to-publish Privacy Policy (Screen 73).
 * 2. Spec Ref: Section 5.1 of bunon_master_product_build_plan_version_2_5.md (Screen 73).
 * 3. Called By: /legal directory and footer policy links.
 * 4. Calls: AppShell, next/link, and Lucide icons.
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';

export default function PrivacyPolicyPage() {
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
            <h1 className="text-xl font-semibold tracking-tight text-ink">Privacy Policy</h1>
            <p className="text-xs text-muted">Screen 73 · Effective Date: November 13, 2026</p>
          </div>
        </div>

        {/* Policy Content Card */}
        <div className="rounded-[20px] border border-hairline bg-card p-6 md:p-8 space-y-6 text-sm leading-relaxed text-ink shadow-none">
          <section>
            <h2 className="text-base font-semibold text-ink mb-2">Effective Date &amp; Scope</h2>
            <p className="text-muted leading-relaxed">
              Effective Date: November 13, 2026. Welcome to Bunon (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). Bunon provides an adaptive goal-planning and proof-of-work web and mobile application. This Privacy Policy explains what information we collect, how we use and protect it, and how you can export or permanently delete your data at any time.
            </p>
          </section>

          <div className="h-[1px] w-full bg-hairline" />

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">1. Eligibility (Adults 18+ Only)</h2>
            <p className="text-muted leading-relaxed">
              Bunon is designed strictly for adults aged 18 and over. At sign-up, we collect your birth year to verify eligibility. If you are under 18, you may not create an account or use Bunon, and any sign-up details entered are immediately discarded.
            </p>
          </section>

          <div className="h-[1px] w-full bg-hairline" />

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted leading-relaxed">
              <li>
                <strong className="text-ink">Account Information:</strong> Your email address, name, birth year, country, preferred language (English or বাংলা), and optional profile details (short bio, city/country, work/study role, and profile photo).
              </li>
              <li>
                <strong className="text-ink">Goal &amp; Journey Data:</strong> Your goals, onboarding answers, milestones, daily tasks, day notes, remembered journey context (&ldquo;What Bunon knows&rdquo;), and uploaded proof items (photos, 15–30 second videos, PDFs/files, links, and written captions).
              </li>
              <li>
                <strong className="text-ink">Technical &amp; Payment Metadata:</strong> Device timezone, app version, AI token usage/latency logs (counts only), and payment transaction identifiers from our payment gateways (we never store your full card number or mobile wallet PIN).
              </li>
            </ul>
          </section>

          <div className="h-[1px] w-full bg-hairline" />

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">3. How We Use AI &amp; Protect Your Content</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted leading-relaxed">
              <li>
                <strong className="text-ink">Paid-Tier Google Gemini API:</strong> Bunon uses the paid commercial tier of the Google Gemini API to generate and adapt your roadmaps, weekly tasks, and weekly summaries. Under paid commercial terms, your prompts, notes, and data are NOT used to train Google&apos;s public AI models.
              </li>
              <li>
                <strong className="text-ink">No AI Reading of Your Proof Photos/Videos:</strong> In Version 1, Bunon does not run AI verification on your uploaded proof photos, videos, or files. Your proof belongs to you.
              </li>
              <li>
                <strong className="text-ink">Strict Admin Privacy Boundary:</strong> Your goals, uploaded proof files, and day notes are private by default. Bunon administrators are technically blocked from viewing your private proof files or day notes; admins can only view account metadata and usage counts, except when investigating a specific public page that has been reported for abuse.
              </li>
            </ul>
          </section>

          <div className="h-[1px] w-full bg-hairline" />

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">4. Data Storage, Security &amp; Cross-Border Hosting</h2>
            <p className="text-muted leading-relaxed">
              Your data and private proof files are stored securely using PostgreSQL Row-Level Security (RLS) and encrypted cloud storage hosted via Supabase in the Singapore (ap-southeast-1) region, with application hosting on Vercel. Private proof files are accessed only via short-lived cryptographic Signed URLs.
            </p>
          </section>

          <div className="h-[1px] w-full bg-hairline" />

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">5. Your Control: Inspecting, Exporting &amp; Deleting Your Data</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted leading-relaxed">
              <li>
                <strong className="text-ink">Edit or Remove Remembered Context:</strong> You can inspect, pin, edit, or delete any remembered constraint or preference inside &ldquo;What Bunon knows&rdquo; from the Left Drawer or your Roadmap.
              </li>
              <li>
                <strong className="text-ink">Delete a Single Goal:</strong> You can permanently delete any individual goal, along with all of its tasks, uploaded proof files, and Journey Card, from that goal&apos;s Danger Zone.
              </li>
              <li>
                <strong className="text-ink">Export or Delete Your Entire Account:</strong> In Settings &gt; Privacy and data, you can download an export of your data or type &ldquo;DELETE&rdquo; to permanently wipe your account, database records, and all stored proof files from our servers.
              </li>
            </ul>
          </section>

          <div className="h-[1px] w-full bg-hairline" />

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">6. Contact Us</h2>
            <p className="text-muted leading-relaxed">
              If you have any questions about this Privacy Policy or your data, contact us anytime through{' '}
              <Link href="/support" className="text-ink underline hover:text-muted">
                Help &amp; Support
              </Link>{' '}
              inside the Bunon app.
            </p>
          </section>
        </div>
      </article>
    </AppShell>
  );
}
