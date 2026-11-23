'use client';
/**
 * 1. Purpose: Renders individual X/Threads-style posts (Proof, Day Note, Milestone Reached) along the left gutter thread.
 * 2. Spec Ref: Stitch timeline_personal_journey_feed Screen 61 and UI Design Guide Category F.
 * 3. Called By: TimelineView.
 * 4. Calls: Lucide icons and EntryDetailViewer.
 */

import React from 'react';
import { CheckCircle, MoreHorizontal } from 'lucide-react';
import type { TimelinePost } from '@/lib/services/timeline-service';

interface TimelinePostCardProps {
  post: TimelinePost;
  onOpenOptions: (post: TimelinePost) => void;
  onOpenViewer: (post: TimelinePost) => void;
}

export function TimelinePostCard({
  post,
  onOpenOptions,
  onOpenViewer,
}: Readonly<TimelinePostCardProps>) {
  if (post.type === 'DAY_NOTE') {
    return (
      <article className="relative flex w-full border-b border-hairline">
        {/* Left Gutter: Quiet Grey Node on Thread */}
        <div className="w-14 shrink-0 flex justify-center pt-5 relative z-10">
          <div className="w-2.5 h-2.5 rounded-full bg-muted ring-4 ring-card" />
        </div>
        {/* Right Content Column */}
        <div className="flex-1 min-w-0 pr-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted">
              Day {post.dayNumber} · {post.dateStr} · Day note (only you)
            </span>
            <button
              type="button"
              aria-label="Entry options"
              onClick={() => onOpenOptions(post)}
              className="w-7 h-7 -mr-1 flex items-center justify-center text-muted hover:text-ink rounded-full cursor-pointer"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
          <p className="text-[14px] text-ink pt-1 leading-relaxed font-normal">
            {post.caption}
          </p>
        </div>
      </article>
    );
  }

  if (post.type === 'MILESTONE_REACHED') {
    return (
      <article className="relative flex w-full border-b border-hairline">
        {/* Left Gutter: Ringed Marigold Knot on Thread */}
        <div className="w-14 shrink-0 flex justify-center pt-5 relative z-10">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-[#FFB020] bg-card flex items-center justify-center ring-4 ring-card">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FFB020]" />
          </div>
        </div>
        {/* Right Content Column */}
        <div className="flex-1 min-w-0 pr-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted">
              Day {post.dayNumber} · {post.dateStr} · Milestone {post.milestonePosition} reached
            </span>
            <button
              type="button"
              aria-label="Entry options"
              onClick={() => onOpenOptions(post)}
              className="w-7 h-7 -mr-1 flex items-center justify-center text-muted hover:text-ink rounded-full cursor-pointer"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
          <h3 className="text-[15px] font-semibold text-ink pt-0.5">
            {post.milestoneTitle}
          </h3>
          <p className="text-[12.5px] text-muted pt-0.5 leading-relaxed">
            {post.caption}
          </p>
        </div>
      </article>
    );
  }

  // Default: PROOF post
  return (
    <article className="relative flex w-full border-b border-hairline">
      {/* Left Gutter: Solid Marigold Dot on Thread */}
      <div className="w-14 shrink-0 flex justify-center pt-5 relative z-10">
        <div className="w-3 h-3 rounded-full bg-[#FFB020] ring-4 ring-card shadow-[0_0_0_1px_rgba(255,176,32,0.3)]" />
      </div>
      {/* Right Content Column */}
      <div className="flex-1 min-w-0 pr-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-muted">
            Day {post.dayNumber} · {post.dateStr} · {post.timestampStr}
          </span>
          <button
            type="button"
            aria-label="Entry options"
            onClick={() => onOpenOptions(post)}
            className="w-7 h-7 -mr-1 flex items-center justify-center text-muted hover:text-ink rounded-full cursor-pointer"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>

        {post.caption && (
          <p className="text-[14px] text-ink pt-1 pb-2 leading-relaxed">
            {post.caption}
          </p>
        )}

        {/* Embedded Proof Photo / Media Card */}
        {(post.signed_url || post.mediaUrl) && (
          <div
            onClick={() => onOpenViewer(post)}
            className="relative w-full overflow-hidden rounded-2xl border border-hairline bg-secondary-surface mt-2 cursor-pointer group"
          >
            <img
              src={post.signed_url || post.mediaUrl || ''}
              alt={post.caption_note || post.caption || 'Task proof'}
              className="w-full max-h-[420px] object-cover rounded-2xl border border-hairline transition-transform duration-200 group-hover:scale-[1.01]"
            />
          </div>
        )}

        {/* Meta Milestone Stamp */}
        <div className="pt-2 flex items-center gap-1.5 text-muted text-[12px]">
          <CheckCircle size={14} className="text-muted shrink-0" />
          <span className="truncate">
            {post.taskTitle} · Milestone {post.milestonePosition}
          </span>
        </div>
      </div>
    </article>
  );
}
