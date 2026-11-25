/**
 * 1. Purpose: Renders the Feedback form (Screen 76) and State 77 confirmation.
 * 2. Spec Ref: Screen 76 Feedback form and State 77 in Stitch UI Design Guide Category G.
 * 3. Called By: Left Drawer, Desktop Sidebar, and in-app feedback triggers.
 * 4. Calls: /api/support, AppShell, next/link, and Lucide icons.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';
import { PrimaryButton } from '@/components/ui/primary-button';

const tags = ['Idea', 'Something felt confusing', 'Other'] as const;
type FeedbackTag = (typeof tags)[number];

export default function FeedbackPage() {
  const router = useRouter();
  const [selectedTag, setSelectedTag] = useState<FeedbackTag>('Idea');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
          kind: 'FEEDBACK',
          category_tag: selectedTag,
          message: message.trim(),
          screen_path: '/feedback',
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || 'Could not send feedback');
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
            <h1 className="text-xl font-semibold tracking-tight text-ink">Send feedback</h1>
            <p className="text-xs text-muted">Screen 76 · Help shape the future of Bunon</p>
          </div>
        </div>

        {submitted ? (
          /* State 77 Confirmation */
          <div className="rounded-[20px] border border-hairline bg-card p-6 md:p-8 text-center space-y-4 shadow-none">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary-surface text-ink">
              <CheckCircle2 size={24} />
            </div>
            <h2 className="text-lg font-semibold text-ink">Thank you. We read every message.</h2>
            <p className="text-sm text-muted max-w-[380px] mx-auto leading-relaxed">
              Your feedback goes directly to our product team to help make Bunon quieter and more helpful.
            </p>
            <div className="pt-2">
              <PrimaryButton onClick={() => router.push('/today')}>
                Back to Today
              </PrimaryButton>
            </div>
          </div>
        ) : (
          /* Feedback Form */
          <form
            onSubmit={handleSubmit}
            className="rounded-[20px] border border-hairline bg-card p-6 md:p-8 space-y-6 shadow-none"
          >
            {/* Tag Pills */}
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-2.5">
                What kind of feedback is this?
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(tag)}
                      className={`h-9 px-4 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#1A1A1B] text-white dark:bg-white dark:text-[#1A1A1B]'
                          : 'bg-secondary-surface text-ink hover:bg-hairline'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Textarea */}
            <div>
              <label
                htmlFor="feedback-message"
                className="block text-xs font-medium text-muted uppercase tracking-wider mb-2"
              >
                Your thoughts
              </label>
              <textarea
                id="feedback-message"
                rows={5}
                required
                maxLength={1000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your thoughts, suggestions, or what felt confusing..."
                className="w-full rounded-xl border border-hairline bg-page px-3.5 py-3 text-sm text-ink placeholder:text-muted/60 focus:border-ink focus:outline-none transition-colors resize-none leading-relaxed"
              />
              <div className="mt-1.5 flex justify-between text-[11px] text-muted">
                <span>Maximum 1,000 characters</span>
                <span>{message.length} / 1000</span>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-3 text-xs text-red-600 dark:border-red-950 dark:bg-red-950/20 dark:text-red-400">
                {errorMsg}
              </div>
            )}

            {/* Primary Submit Button */}
            <div className="pt-2">
              <PrimaryButton type="submit" disabled={submitting || !message.trim()}>
                {submitting ? 'Sending...' : 'Send feedback'}
              </PrimaryButton>
            </div>

            <p className="text-center text-xs text-muted">
              Need technical support or billing help? Visit{' '}
              <Link href="/support" className="text-ink underline hover:text-muted">
                Help &amp; support
              </Link>
              .
            </p>
          </form>
        )}
      </div>
    </AppShell>
  );
}
