'use client';
/**
 * 1. Purpose: Displays State 51 Milestone opened with proofs grouped directly under expected result.
 * 2. Spec Ref: Stitch State 51 and UI Design Guide Category E.
 * 3. Called By: RoadmapView.
 * 4. Calls: BottomSheet and next/link.
 */

import React from 'react';
import Link from 'next/link';
import { BottomSheet } from '@/components/ui/bottom-sheet';

export interface MilestoneProofItem {
  id: string;
  file_path?: string;
  signed_url?: string;
  mediaUrl?: string;
  caption?: string;
  caption_note?: string;
  created_at: string;
}

interface MilestoneDetailProps {
  milestone: {
    id: string;
    position: number;
    title: string;
    expected_result: string;
    estimated_hours: number;
    competency_status?: string;
    status: string;
    proofs?: MilestoneProofItem[];
  } | null;
  onClose: () => void;
}

export function MilestoneDetailModal({ milestone, onClose }: Readonly<MilestoneDetailProps>) {
  if (!milestone) return null;

  return (
    <BottomSheet isOpen={Boolean(milestone)} onClose={onClose} title={`Milestone ${milestone.position}`}>
      <div className="flex flex-col gap-4 pb-2">
        <div>
          <h2 className="text-[18px] font-bold text-ink leading-tight">{milestone.title}</h2>
          <div className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-secondary-surface text-[11px] font-medium text-muted">
            {milestone.competency_status || milestone.status} · {milestone.estimated_hours}h estimated
          </div>
        </div>

        {/* Tangible Expected Result Banner */}
        <div className="p-3.5 rounded-[14px] bg-secondary-surface border border-hairline">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
            Expected Result
          </div>
          <p className="text-[13.5px] text-ink leading-relaxed font-normal">
            {milestone.expected_result}
          </p>
        </div>

        {/* Proofs toward this result */}
        <div>
          <div className="text-[12px] font-semibold text-ink mb-2">
            Proofs toward this result ({milestone.proofs?.length || 0})
          </div>
          {milestone.proofs && milestone.proofs.length > 0 ? (
            <div className="flex flex-col gap-3">
              {milestone.proofs.map((proof) => {
                const photoSrc = proof.signed_url || proof.mediaUrl || proof.file_path;
                return (
                  <div
                    key={proof.id}
                    className="flex flex-col gap-2 p-3 rounded-[16px] border border-hairline bg-card overflow-hidden"
                  >
                    {photoSrc && (
                      <img
                        src={photoSrc}
                        alt={proof.caption_note || proof.caption || 'Task proof'}
                        className="w-full max-h-[420px] object-cover rounded-2xl border border-hairline"
                      />
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[13px] text-ink font-normal truncate pr-2">
                        {proof.caption_note || proof.caption || 'Completed proof'}
                      </span>
                      <Link
                        href={`/timeline?milestoneId=${milestone.id}`}
                        className="text-[11.5px] font-medium text-muted hover:text-ink shrink-0"
                      >
                        View on timeline ›
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center rounded-[12px] border border-dashed border-hairline text-[12px] text-muted">
              No proofs saved for this milestone yet. Complete tasks on Today to build your proof thread.
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
