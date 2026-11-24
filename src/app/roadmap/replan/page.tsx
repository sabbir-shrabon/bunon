'use client';
/**
 * 1. Purpose: Client page for Screen 56 Re-plan Preview showing revised remaining milestones.
 * 2. Spec Ref: UI Design Guide Category E Screen 56 and Pipeline 6.
 * 3. Called By: Roadmap GoalMenu, RescueSheet, and ExtendDeadlineSheet.
 * 4. Calls: /api/goals/[id]/replan and PrimaryButton.
 */

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, Lock } from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';
import { PrimaryButton } from '@/components/ui/primary-button';

interface RevisedMilestone {
  position: number;
  title: string;
  expected_result: string;
  estimated_hours: number;
  target_metric_value?: number | null;
  target_metric_unit?: string | null;
}

function ReplanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const goalId = searchParams.get('goalId');
  const reason = searchParams.get('reason') || 'MANUAL_RESTRUCTURE';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState('');
  const [revisedMilestones, setRevisedMilestones] = useState<RevisedMilestone[]>([]);
  const [completedMilestones, setCompletedMilestones] = useState<Array<{ id: string; title: string; position: number }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!goalId) return;
    fetch(`/api/goals/${goalId}/replan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ replanReason: reason }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.message || data.error);
        else {
          setSummary(data.replanSummary);
          setRevisedMilestones(data.revisedMilestones || []);
          setCompletedMilestones(data.completedMilestones || []);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [goalId, reason]);

  const handleAccept = async () => {
    if (!goalId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/goals/${goalId}/replan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPLY',
          revisedMilestones,
        }),
      });
      if (res.ok) {
        router.push(`/roadmap?goalId=${goalId}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col w-full max-w-[640px] mx-auto px-5 pt-4 pb-20">
        {/* Top Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary-surface text-ink cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-[20px] font-bold text-ink">Re-plan preview</h1>
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted text-sm">
            Evaluating remaining milestones with Bunon intelligence...
          </div>
        ) : error ? (
          <div className="p-4 rounded-[14px] bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Summary Banner */}
            <div className="p-4 rounded-[16px] bg-secondary-surface border border-hairline">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Proposed Changes
              </div>
              <p className="text-[14px] text-ink leading-relaxed font-normal">{summary}</p>
            </div>

            {/* Locked Completed Milestones */}
            {completedMilestones.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted mb-2">
                  <Lock size={13} />
                  <span>Already completed ({completedMilestones.length}) · Safely locked</span>
                </div>
                <div className="flex flex-col gap-2">
                  {completedMilestones.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-2.5 p-3 rounded-[12px] bg-card border border-hairline opacity-75"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#FFB020] text-white flex items-center justify-center text-[10px]">
                        <Check size={12} />
                      </div>
                      <span className="text-[13px] font-medium text-ink">
                        Milestone {m.position}: {m.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revised Remaining Milestones */}
            <div>
              <div className="text-[12px] font-semibold text-ink mb-2">
                Revised remaining milestones ({revisedMilestones.length})
              </div>
              <div className="flex flex-col gap-3">
                {revisedMilestones.map((m) => (
                  <div
                    key={m.position}
                    className="p-4 rounded-[16px] bg-card border border-hairline shadow-none flex flex-col gap-1.5"
                  >
                    <div className="text-[11px] font-medium text-muted">
                      Milestone {m.position} · {m.estimated_hours}h estimated
                    </div>
                    <div className="text-[15px] font-bold text-ink">{m.title}</div>
                    <p className="text-[13px] text-muted leading-relaxed">{m.expected_result}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Fixed Action Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-hairline md:left-[250px] flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="h-[52px] flex-1 rounded-full border border-hairline text-[14px] font-medium text-ink hover:bg-secondary-surface transition-colors cursor-pointer"
              >
                Keep my current plan
              </button>
              <div className="flex-1">
                <PrimaryButton onClick={handleAccept} disabled={submitting}>
                  {submitting ? 'Applying...' : 'Accept the new plan'}
                </PrimaryButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function ReplanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page text-muted text-sm">
          Loading re-plan...
        </div>
      }
    >
      <ReplanContent />
    </Suspense>
  );
}
