/**
 * 1. Purpose: Displays FAQ answers and the Contact the team form (Screen 76a).
 * 2. Spec Ref: Screen 76a Help & support and State 77 in Stitch UI Design Guide Category G.
 * 3. Called By: Left Drawer, Desktop Sidebar, and support links.
 * 4. Calls: /api/support, AppShell, next/link, and Lucide icons.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, ChevronDown } from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';
import { PrimaryButton } from '@/components/ui/primary-button';

const faqs = [
  {
    question: 'How Bunon works',
    answer:
      'Bunon helps you turn 4-week to 12-month goals into clear, achievable steps. Each week is completion-gated: complete tasks at your own pace, prove your work with real photos or notes, and earn free Journey Cards.',
  },
  {
    question: 'Adding proof to finish tasks',
    answer:
      'On your final sub-step each day, tap the camera circle or "Note / link" to attach evidence of your work. Free accounts can upload 1 photo per day plus unlimited notes and links.',
  },
  {
    question: 'Resetting password',
    answer:
      'If you forget your password, tap "Forgot password?" on the sign-in screen to receive a secure reset link at your registered email address.',
  },
  {
    question: 'Pausing a goal',
    answer:
      'Need a break? You can voluntarily pause any active goal for up to 14 days from the goal settings page. Your tasks, milestones, and streak knot will be preserved until you resume.',
  },
  {
    question: 'Prepaid Pro passes & billing',
    answer:
      'Bunon Pro passes are one-time prepaid purchases (1, 3, 6, or 12 months) with zero recurring auto-renewals. Pro unlocks up to 3 active goals, video & PDF evidence, and 2 GB cloud storage.',
  },
];

export default function SupportPage() {
  const router = useRouter();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || submitting) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'SUPPORT',
          category_tag: 'GENERAL',
          message: message.trim(),
          screen_path: '/support',
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || 'Could not submit your message');
      }

      setSubmitted(true);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[640px] px-4 pt-6 pb-24 md:py-8 md:pb-10 space-y-6">
        {/* Header */}
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
            <h1 className="text-xl font-semibold tracking-tight text-ink">Help &amp; support</h1>
            <p className="text-xs text-muted">Screen 76a · Frequently asked questions &amp; direct team support</p>
          </div>
        </div>

        {/* Section 1: Collapsible FAQs */}
        <div className="rounded-[20px] border border-hairline bg-card overflow-hidden shadow-none">
          <div className="border-b border-hairline px-5 py-3.5 bg-secondary-surface/30">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Frequently asked questions
            </h2>
          </div>
          <div className="divide-y divide-hairline">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={faq.question}>
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="flex w-full items-center justify-between p-4.5 text-left text-[14.5px] font-medium text-ink hover:bg-secondary-surface/40 transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      size={18}
                      className={`text-muted shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-ink' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4.5 pb-4.5 pt-1 text-sm text-muted leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Contact the Team Form */}
        <div className="rounded-[20px] border border-hairline bg-card p-6 md:p-8 space-y-4 shadow-none">
          {submitted ? (
            /* State 77 Confirmation */
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary-surface text-ink">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="text-lg font-semibold text-ink">Thank you. We read every message.</h2>
              <p className="text-sm text-muted max-w-[380px] mx-auto leading-relaxed">
                Our support team will review your message and reply directly to your registered account email address.
              </p>
              <div className="pt-2">
                <PrimaryButton onClick={() => router.push('/today')}>
                  Back to Today
                </PrimaryButton>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-ink">Contact the team</h2>
                <p className="text-xs text-muted mt-0.5">
                  Have an issue or billing question? Send a message directly to our human team.
                </p>
              </div>

              <div>
                <label
                  htmlFor="support-message"
                  className="block text-xs font-medium text-muted uppercase tracking-wider mb-2"
                >
                  Describe your problem or request
                </label>
                <textarea
                  id="support-message"
                  rows={4}
                  required
                  maxLength={1000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what happened, or enter your Transaction ID if asking about a payment..."
                  className="w-full rounded-xl border border-hairline bg-page px-3.5 py-3 text-sm text-ink placeholder:text-muted/60 focus:border-ink focus:outline-none transition-colors resize-none leading-relaxed"
                />
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-red-200 bg-red-50/50 p-3 text-xs text-red-600 dark:border-red-950 dark:bg-red-950/20 dark:text-red-400">
                  {errorMsg}
                </div>
              )}

              <PrimaryButton type="submit" disabled={submitting || !message.trim()}>
                {submitting ? 'Sending...' : 'Send message'}
              </PrimaryButton>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
