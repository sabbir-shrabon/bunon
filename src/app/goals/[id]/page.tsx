'use client';
/**
 * 1. Purpose: Displays Screen 86 Single Goal page with Danger Zone delete Sheet 87.
 * 2. Spec Ref: UI Design Guide Category G Screens 86 & 87.
 * 3. Called By: Navigation from /goals.
 * 4. Calls: AppShell, BottomSheet, PrimaryButton, and /api/goals/[id]/delete.
 */

import React, { Suspense, useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';
import { BottomSheet } from '@/components/ui/bottom-sheet';

interface GoalDetail {
  id: string;
  title: string;
  why: string;
  category: string;
  status: string;
  deadline: string;
  created_at: string;
  completed_at?: string;
  journeyCard?: { public_slug: string } | null;
}

function SingleGoalContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: goalId } = use(params);
  const router = useRouter();

  const [goal, setGoal] = useState<GoalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/today`)
      .then((res) => res.json())
      .then((data) => {
        const found = data.allGoals?.find((g: GoalDetail) => g.id === goalId) || data.activeGoal;
        if (found) setGoal(found);
      })
      .finally(() => setLoading(false));
  }, [goalId]);

  const handleDelete = async () => {
    if (!goal || confirmInput.trim().toLowerCase() !== goal.title.trim().toLowerCase()) {
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/goals/${goal.id}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmName: confirmInput }),
      });
      if (res.ok) {
        setIsDeleteOpen(false);
        router.push('/goals');
      } else {
        const data = await res.json();
        setDeleteError(data.error || 'Delete failed');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const isMatch = goal && confirmInput.trim().toLowerCase() === goal.title.trim().toLowerCase();

  return (
    <AppShell>
      <div className="flex flex-col w-full max-w-[640px] mx-auto px-5 pt-4 pb-24 md:pb-12">
        <div className="flex items-center gap-3 mb-5">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary-surface text-ink cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-[20px] font-bold text-ink">Goal Details</h1>
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted text-sm">Loading goal...</div>
        ) : !goal ? (
          <div className="py-20 text-center text-muted text-sm">Goal not found.</div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Header info */}
            <section className="p-5 rounded-[20px] bg-card border border-hairline flex flex-col gap-3">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-secondary-surface text-[11px] font-medium text-muted w-fit">
                {goal.status} · {goal.category}
              </span>
              <h2 className="text-[22px] font-bold text-ink">{goal.title}</h2>
              <p className="text-[14px] text-muted leading-relaxed font-normal">{goal.why}</p>

              <div className="pt-3 border-t border-hairline flex items-center justify-between text-[13px] text-muted">
                <span>Target: {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <Link href={`/timeline?goalId=${goal.id}`} className="font-medium text-ink hover:underline">
                  View Timeline ›
                </Link>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="p-5 rounded-[20px] border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-[14px]">
                <AlertTriangle size={16} />
                <span>Danger Zone</span>
              </div>
              <p className="text-[13px] text-muted leading-relaxed">
                Permanently deletes this goal, all associated milestones, tasks, and proofs. This action is irreversible.
              </p>
              <button
                type="button"
                onClick={() => {
                  setConfirmInput('');
                  setDeleteError(null);
                  setIsDeleteOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-full border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-medium text-[13px] hover:bg-red-100/50 transition-colors cursor-pointer w-fit"
              >
                <Trash2 size={15} />
                <span>Delete this goal</span>
              </button>
            </section>
          </div>
        )}
      </div>

      {/* Sheet 87: Danger Zone Delete Confirmation */}
      {goal && (
        <BottomSheet isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete goal permanently">
          <div className="flex flex-col gap-4 pb-2">
            <p className="text-[13.5px] text-muted leading-relaxed">
              This will permanently delete <span className="font-semibold text-ink">&ldquo;{goal.title}&rdquo;</span>, including every proof photo and milestone note.
            </p>

            <div>
              <label className="text-[12px] font-medium text-ink block mb-1.5">
                Type <span className="font-bold select-all">&ldquo;{goal.title}&rdquo;</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={goal.title}
                className="w-full h-11 px-3 rounded-[12px] border border-hairline bg-card text-ink text-[14px] focus:outline-none"
              />
            </div>

            {deleteError && (
              <div className="text-[12px] text-red-600 font-medium">{deleteError}</div>
            )}

            <button
              type="button"
              onClick={handleDelete}
              disabled={!isMatch || isDeleting}
              className="h-[52px] w-full rounded-full bg-red-600 text-white font-medium text-[14px] transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Permanently delete goal, tasks, and proofs'}
            </button>
          </div>
        </BottomSheet>
      )}
    </AppShell>
  );
}

export default function SingleGoalPage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page text-muted text-sm">
          Loading goal...
        </div>
      }
    >
      <SingleGoalContent params={props.params} />
    </Suspense>
  );
}
