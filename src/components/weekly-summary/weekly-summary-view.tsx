'use client';
/**
 * 1. Purpose: Displays Screen 37 Weekly Summary with Then vs. Now, 1080x1350 Photocard, and memory confirmation.
 * 2. Spec Ref: UI Design Guide Category C Screen 37 and Pipeline 5.
 * 3. Called By: /weekly-summary/[id] page.
 * 4. Calls: AppShell, PhotocardCanvas1080x1350, and PrimaryButton.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';
import { PrimaryButton } from '@/components/ui/primary-button';
import { PhotocardCanvas1080x1350 } from '@/components/photocard/PhotocardCanvas1080x1350';

interface WeeklySummaryViewProps {
  review: {
    id: string;
    week_number: number;
    ai_summary: string;
    three_bullet_lines: string[];
    partner_share_line?: string;
    then_vs_now_line?: string;
    memory_confirmation_prompt_json?: {
      memory_id: string;
      fact: string;
      question_text: string;
    } | null;
    goals: {
      id: string;
      title: string;
      category: string;
      current_baseline_text: string;
      streak_weeks: number;
    };
  };
}

export function WeeklySummaryView({ review }: Readonly<WeeklySummaryViewProps>) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState<boolean | null>(null);

  const goal = review.goals;
  const wittyLine = `Week ${review.week_number} finished · Keeping the rhythm steady.`;
  const minimalLine = review.partner_share_line || `Finished Week ${review.week_number} goals on track.`;
  const storyLine = review.three_bullet_lines?.[0] || 'Real tangible progress logged with proof.';

  return (
    <AppShell>
      <div className="flex flex-col w-full max-w-[640px] mx-auto px-5 pt-4 pb-40 md:pb-28">
        {/* Top Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary-surface text-ink cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-[20px] font-bold text-ink">
              Week {review.week_number} Summary
            </h1>
            <span className="text-[12px] text-muted">{goal?.title}</span>
          </div>
        </div>

        {/* 1. Calm Plain-Words Outcome Summary */}
        <section className="p-5 rounded-[20px] bg-card border border-hairline mb-5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted mb-1.5">
            What was built this week
          </div>
          <p className="text-[14.5px] text-ink leading-relaxed font-normal mb-4">
            {review.ai_summary}
          </p>

          <div className="flex flex-col gap-2 pt-3 border-t border-hairline">
            {review.three_bullet_lines?.map((line) => (
              <div key={line} className="flex items-start gap-2 text-[13px] text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFB020] mt-2 shrink-0" />
                <span className="text-ink">{line}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. 'Then vs. Now' Card from Day-1 Baseline */}
        {goal?.current_baseline_text && (
          <section className="p-5 rounded-[20px] bg-secondary-surface border border-hairline mb-5">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ink mb-2">
              <Sparkles size={14} className="text-[#FFB020]" />
              <span>Then vs. Now</span>
            </div>
            <div className="text-[13px] text-muted mb-2">
              <span className="font-medium text-ink">On Day 1 you said: </span>
              &ldquo;{goal.current_baseline_text}&rdquo;
            </div>
            <p className="text-[13.5px] text-ink font-medium leading-relaxed">
              {review.then_vs_now_line || 'You have turned daily steps into proven progress.'}
            </p>
          </section>
        )}

        {/* 3. 'I Noticed… Is That Right?' Confirmation */}
        {review.memory_confirmation_prompt_json && confirmed === null && (
          <section className="p-4 rounded-[16px] bg-card border border-hairline mb-5">
            <div className="text-[13px] font-medium text-ink mb-1.5">
              I noticed… is that right?
            </div>
            <p className="text-[13px] text-muted leading-relaxed mb-3">
              {review.memory_confirmation_prompt_json.question_text}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmed(true)}
                className="px-3.5 py-1.5 rounded-full bg-[#1A1A1B] text-white text-[12px] font-medium cursor-pointer"
              >
                Yes, that&apos;s right
              </button>
              <button
                type="button"
                onClick={() => setConfirmed(false)}
                className="px-3.5 py-1.5 rounded-full bg-secondary-surface text-muted text-[12px] font-medium cursor-pointer"
              >
                Not quite
              </button>
            </div>
          </section>
        )}
        {confirmed !== null && (
          <div className="p-3 rounded-[12px] bg-secondary-surface text-[12px] text-muted mb-5 flex items-center gap-1.5">
            <Check size={14} className="text-emerald-600" />
            <span>Preference recorded in What Bunon knows</span>
          </div>
        )}

        {/* 4. 1080x1350 Social Photocard Generator */}
        <section className="mb-6 flex flex-col items-center">
          <div className="text-[13px] font-semibold text-ink mb-3 self-start">
            Shareable Week Photocard (1080×1350)
          </div>
          <PhotocardCanvas1080x1350
            goalTitle={goal?.title || 'Bunon Goal'}
            chapterBadge={`Week ${review.week_number} Complete`}
            wittyLine={wittyLine}
            minimalLine={minimalLine}
            storyLine={storyLine}
            statPills={[
              `Week ${review.week_number}`,
              `${goal?.streak_weeks || 1}w Streak`,
              'On Track',
            ]}
          />
        </section>

        {/* 5. What Bunon Knows Link */}
        <div className="flex justify-between items-center p-4 rounded-[16px] bg-card border border-hairline mb-6">
          <div>
            <div className="text-[13.5px] font-medium text-ink">What Bunon knows</div>
            <div className="text-[11.5px] text-muted">View or edit competencies and rhythm facts</div>
          </div>
          <Link
            href={`/what-bunon-knows?goalId=${goal?.id}`}
            className="text-[12px] font-medium text-ink hover:opacity-75 transition-opacity"
          >
            View / edit ›
          </Link>
        </div>

        {/* Bottom CTA */}
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 right-0 z-30 p-4 bg-card/95 backdrop-blur-md border-t border-hairline md:left-[250px] md:pb-[max(1rem,env(safe-area-inset-bottom,0px))] flex justify-center">
          <div className="w-full max-w-[640px]">
            <PrimaryButton onClick={() => router.push('/today')}>
              Go to Today
            </PrimaryButton>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
