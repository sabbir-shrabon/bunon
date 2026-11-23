'use client';
/**
 * 1. Purpose: Client view for Screen 61 Timeline X/Threads personal feed with discrete posts and month calendar.
 * 2. Spec Ref: Stitch timeline_personal_journey_feed Screen 61 and UI Design Guide Category F.
 * 3. Called By: /timeline page.
 * 4. Calls: AppShell, TimelinePostCard, MonthCalendarDrawer, and EntryDetailViewer.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, Filter, Lock, Share2 } from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';
import { TimelinePostCard } from './timeline-post-card';
import { MonthCalendarDrawer } from './month-calendar-drawer';
import { TimelineFilterSheet } from './timeline-filter-sheet';
import { ShareComingSoonSheet } from './share-coming-soon-sheet';
import { EntryDetailViewer } from './entry-detail-viewer';
import { EditProofSheet } from './edit-proof-sheet';
import { GoalSwitcherSheet } from '@/components/today/goal-switcher-sheet';
import type { TimelinePost } from '@/lib/services/timeline-service';

interface TimelineViewProps {
  initialPosts: TimelinePost[];
  goals: Array<{ id: string; title: string }>;
  calendar: {
    year: number;
    month: number;
    activeDaysCount: number;
    activityMap: Record<number, 'PROOF' | 'MILESTONE'>;
  };
}

export function TimelineView({
  initialPosts,
  goals,
  calendar,
}: Readonly<TimelineViewProps>) {
  const [posts, setPosts] = useState<TimelinePost[]>(initialPosts);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [groupByMilestone, setGroupByMilestone] = useState(false);
  const [selectedPost, setSelectedPost] = useState<TimelinePost | null>(null);
  const [editingPost, setEditingPost] = useState<TimelinePost | null>(null);

  const activeGoal = goals[0];

  const handleApplyFilter = async (goalId?: string, proofType?: string) => {
    const params = new URLSearchParams();
    if (goalId) params.set('goalId', goalId);
    if (proofType && proofType !== 'ALL') params.set('proofType', proofType);

    const res = await fetch(`/api/timeline?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setPosts(data.posts || []);
    }
  };

  const handlePostUpdated = (updated: TimelinePost) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  return (
    <AppShell>
      <div className="flex flex-col w-full max-w-[640px] mx-auto min-h-screen bg-card">
        {/* Compact Sub-Header */}
        <header className="w-full bg-card border-b border-hairline px-4 py-3 sticky top-14 z-20">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsSwitcherOpen(true)}
              className="flex items-center gap-1.5 active:opacity-70 transition-opacity font-semibold text-[17px] text-ink tracking-tight cursor-pointer"
            >
              <span>{activeGoal?.title || 'All goals'}</span>
              <span className="text-[16px] text-muted">▾</span>
            </button>
            <div className="flex items-center gap-1 text-muted">
              <button
                type="button"
                aria-label="Toggle calendar view"
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                  isCalendarOpen ? 'bg-secondary-surface text-ink' : 'hover:bg-secondary-surface'
                }`}
              >
                <Calendar size={18} />
              </button>
              <button
                type="button"
                aria-label="Filter timeline"
                onClick={() => setIsFilterOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary-surface transition-colors cursor-pointer"
              >
                <Filter size={18} />
              </button>
              <button
                type="button"
                aria-label="Share goal log"
                onClick={() => setIsShareOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary-surface transition-colors cursor-pointer"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>

          {/* Row 2: Privacy state + View modes */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1 text-muted text-[12px]">
              <Lock size={12} />
              <span>Private · only you</span>
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <button
                type="button"
                onClick={() => setGroupByMilestone(false)}
                className={`cursor-pointer ${
                  !groupByMilestone ? 'text-ink font-semibold' : 'text-muted hover:text-ink'
                }`}
              >
                By date
              </button>
              <span className="text-muted">·</span>
              <button
                type="button"
                onClick={() => setGroupByMilestone(true)}
                className={`cursor-pointer ${
                  groupByMilestone ? 'text-ink font-semibold' : 'text-muted hover:text-ink'
                }`}
              >
                By milestone
              </button>
            </div>
          </div>
        </header>

        {/* On-Demand Month Calendar Drawer */}
        <MonthCalendarDrawer
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          activityMap={calendar.activityMap}
          activeDaysCount={calendar.activeDaysCount}
          onSelectDay={() => setIsCalendarOpen(false)}
        />

        {/* Continuous Threads-Style Feed Container */}
        <section className="relative w-full flex-1 bg-card pb-16">
          {posts.length === 0 ? (
            /* Screen 62: Timeline Empty State */
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-secondary-surface flex items-center justify-center text-muted mb-4">
                <span className="text-[20px]">🧵</span>
              </div>
              <h2 className="text-[17px] font-semibold text-ink">
                Your journey starts with your first proof
              </h2>
              <p className="text-[13px] text-muted max-w-[280px] mt-1.5 leading-relaxed">
                Finished steps, photos, and day notes will form your continuous timeline here.
              </p>
              <Link
                href="/today"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#1A1A1B] text-white px-5 text-[14px] font-medium"
              >
                Go to Today&apos;s task
              </Link>
            </div>
          ) : (
            <>
              {/* Continuous Spine Thread Line */}
              <div className="absolute left-[27px] top-0 bottom-0 w-[1.5px] bg-hairline pointer-events-none" />

              {posts.map((post) => (
                <TimelinePostCard
                  key={post.id}
                  post={post}
                  onOpenOptions={(p) => setEditingPost(p)}
                  onOpenViewer={(p) => setSelectedPost(p)}
                />
              ))}

              {/* End of Feed Thread Cap */}
              <div className="relative flex w-full py-6 items-center">
                <div className="w-14 shrink-0 flex justify-center relative z-10">
                  <div className="w-2 h-2 rounded-full bg-hairline ring-4 ring-card" />
                </div>
                <span className="text-[12px] text-muted">
                  Beginning of {activeGoal?.title || 'your'} journey
                </span>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Lightbox Viewer */}
      <EntryDetailViewer
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onEdit={(p) => {
          setSelectedPost(null);
          setEditingPost(p);
        }}
      />

      {/* Edit Proof Sheet */}
      <EditProofSheet
        post={editingPost}
        isOpen={Boolean(editingPost)}
        onClose={() => setEditingPost(null)}
        onUpdated={handlePostUpdated}
      />

      {/* Filter Sheet */}
      <TimelineFilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        goals={goals}
        onApply={handleApplyFilter}
      />

      {/* Share Coming Soon Sheet */}
      <ShareComingSoonSheet
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      {/* Goal Switcher Sheet */}
      <GoalSwitcherSheet
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        goals={goals.map((g) => ({
          id: g.id,
          title: g.title,
          category: 'OTHER',
          pendingCount: 0,
        }))}
        activeGoalId={activeGoal?.id || goals[0]?.id || ''}
        isPro={false}
        onSelectGoal={(selectedId) => {
          setIsSwitcherOpen(false);
          window.location.href = `/timeline?goalId=${selectedId}`;
        }}
      />
    </AppShell>
  );
}
