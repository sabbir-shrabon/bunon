'use client';
/**
 * 1. Purpose: Full-screen / desktop lightbox viewer for Screen 64 Entry detail viewer.
 * 2. Spec Ref: UI Design Guide Category F Screen 64.
 * 3. Called By: TimelineView and MilestoneDetailModal.
 * 4. Calls: Lucide icons.
 */

import React from 'react';
import { ArrowLeft, Edit3, X } from 'lucide-react';
import type { TimelinePost } from '@/lib/services/timeline-service';

interface EntryDetailViewerProps {
  post: TimelinePost | null;
  onClose: () => void;
  onEdit: (post: TimelinePost) => void;
}

export function EntryDetailViewer({
  post,
  onClose,
  onEdit,
}: Readonly<EntryDetailViewerProps>) {
  if (!post) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between animate-fade-in">
      {/* Top Bar */}
      <div className="h-14 px-4 flex items-center justify-between text-white border-b border-white/10">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onEdit(post)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[12px] font-medium transition-colors cursor-pointer"
          >
            <Edit3 size={14} />
            <span>Edit proof</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Center Media Area */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-auto">
        {(post.signed_url || post.mediaUrl) ? (
          <img
            src={post.signed_url || post.mediaUrl || ''}
            alt={post.caption_note || post.caption || 'Task proof'}
            className="w-full max-h-[420px] object-cover rounded-2xl border border-hairline"
          />
        ) : (
          <div className="p-8 text-center text-white/60 text-sm">
            {post.caption_note || post.caption || 'No image attached'}
          </div>
        )}
      </div>

      {/* Bottom Metadata Bar */}
      <div className="p-5 bg-black/80 text-white border-t border-white/10 max-w-[640px] mx-auto w-full">
        <div className="text-[12px] text-white/60 mb-1">
          Day {post.dayNumber} · {post.dateStr} · {post.timestampStr}
        </div>
        {post.caption && (
          <p className="text-[15px] text-white font-normal leading-relaxed mb-2">
            {post.caption}
          </p>
        )}
        <div className="text-[12px] text-white/60">
          {post.taskTitle} · Milestone {post.milestonePosition}
        </div>
      </div>
    </div>
  );
}
