/**
 * 1. Purpose: Displays About information, paid Gemini AI transparency, and security boundaries.
 * 2. Spec Ref: Screen 93 About & AI notice in Stitch UI Design Guide Category G.
 * 3. Called By: SettingsView.
 * 4. Calls: Lucide icons and Link.
 */

import Link from 'next/link';
import { Cpu, Lock, Server } from 'lucide-react';

export function AboutSection() {
  return (
    <div className="rounded-[20px] border border-hairline bg-card p-5 md:p-6 space-y-4 shadow-none">
      <div className="border-b border-hairline pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          About &amp; AI transparency
        </h2>
        <p className="text-xs text-muted mt-0.5">
          Screen 93 · Technical architecture and privacy boundary
        </p>
      </div>

      <div className="space-y-3.5 text-xs text-muted leading-relaxed">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary-surface text-ink">
            <Cpu size={14} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-ink">
              Paid-Tier Google Gemini API
            </h3>
            <p className="mt-0.5">
              Bunon uses paid commercial Gemini API tokens to generate roadmaps and weekly tasks. Under commercial API terms, your prompts, tasks, and private notes are NEVER used to train Google&apos;s public AI models.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary-surface text-ink">
            <Lock size={14} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-ink">
              Strict Admin Privacy Boundary
            </h3>
            <p className="mt-0.5">
              Your goals, uploaded proof photos/files, and day notes are private by default. Bunon administrators are technically blocked from inspecting your private proof files or notes.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary-surface text-ink">
            <Server size={14} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-ink">
              Singapore Supabase Cloud Hosting
            </h3>
            <p className="mt-0.5">
              All databases and encrypted storage buckets are hosted in the Singapore (ap-southeast-1) region protected by PostgreSQL Row-Level Security (RLS).
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-hairline pt-3 flex items-center justify-between text-xs text-muted">
        <span>Bunon version 1.0.4</span>
        <Link href="/legal" className="text-ink underline hover:text-muted">
          Legal policies
        </Link>
      </div>
    </div>
  );
}
