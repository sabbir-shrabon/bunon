'use client';
/**
 * 1. Purpose: Generates 5-zone 1080x1350 (4:5 portrait) social photocards with a 2-pill vibe switch.
 * 2. Spec Ref: UI Design Guide Category H Screen 97, Screen 37, State 60, and Stitch journey_card.
 * 3. Called By: JourneyCardView, WeeklySummaryView, and MilestoneReachedCelebration.
 * 4. Calls: HTML5 Canvas 2D context for crisp high-resolution export.
 */

import React, { useState, useRef, useCallback } from 'react';
import { Download, Share2 } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/primary-button';

export interface PhotocardProps {
  goalTitle: string;
  userName?: string;
  chapterBadge?: string;
  wittyLine: string;
  minimalLine: string;
  storyLine: string;
  proof1Url?: string | null;
  proof2Url?: string | null;
  statPills: string[];
}

export function PhotocardCanvas1080x1350({
  goalTitle,
  userName = 'Bunon Achiever',
  chapterBadge = 'Chapter 1 Finished',
  wittyLine,
  minimalLine,
  storyLine,
  proof1Url,
  proof2Url,
  statPills,
}: Readonly<PhotocardProps>) {
  const [vibe, setVibe] = useState<'WITTY' | 'MINIMAL'>('WITTY');
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeSubtitle = vibe === 'WITTY' ? wittyLine : minimalLine;

  const handleDownload = useCallback(async () => {
    setIsExporting(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1080, 1350);

      // 2. Outer Border & Margin
      ctx.strokeStyle = '#E3E5E8';
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, 1000, 1270);

      // 3. Top-Right Marigold Seal (#FFB020)
      ctx.fillStyle = '#FFB020';
      ctx.beginPath();
      ctx.arc(960, 120, 36, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✓', 960, 122);

      // 4. Header: Bunon Brand + Tag
      ctx.textAlign = 'left';
      ctx.fillStyle = '#1A1A1B';
      ctx.font = 'bold 36px Inter, sans-serif';
      ctx.fillText('Bunon', 90, 125);

      ctx.fillStyle = '#6B6F76';
      ctx.font = '500 28px Inter, sans-serif';
      ctx.fillText(`·  ${chapterBadge}`, 220, 125);

      // 5. Title
      ctx.fillStyle = '#1A1A1B';
      ctx.font = 'bold 52px Inter, sans-serif';
      ctx.fillText(goalTitle.slice(0, 35), 90, 220);

      // 6. Subtitle
      ctx.fillStyle = '#6B6F76';
      ctx.font = '400 32px Inter, sans-serif';
      const maxSub = activeSubtitle.slice(0, 75);
      ctx.fillText(maxSub, 90, 280);

      // 7. Middle: Central Hairline Thread & Marigold Knot
      ctx.strokeStyle = '#E3E5E8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(90, 660);
      ctx.lineTo(990, 660);
      ctx.stroke();

      ctx.fillStyle = '#FFB020';
      ctx.beginPath();
      ctx.arc(540, 660, 18, 0, Math.PI * 2);
      ctx.fill();

      // Placeholder Proof Rects
      ctx.fillStyle = '#F6F7F8';
      ctx.fillRect(90, 380, 410, 380);
      ctx.fillRect(580, 380, 410, 380);

      ctx.fillStyle = '#6B6F76';
      ctx.font = '500 24px Inter, sans-serif';
      ctx.fillText('Day 1 Proof', 110, 420);
      ctx.fillText('Final Proof', 600, 420);

      // 8. Story
      ctx.fillStyle = '#1A1A1B';
      ctx.font = '500 36px Inter, sans-serif';
      ctx.fillText(storyLine.slice(0, 80), 90, 880);

      // 9. Stat Pills
      let pillX = 90;
      for (const stat of statPills.slice(0, 3)) {
        ctx.fillStyle = '#EDEEF0';
        ctx.beginPath();
        ctx.roundRect(pillX, 940, 240, 64, 32);
        ctx.fill();

        ctx.fillStyle = '#1A1A1B';
        ctx.font = '600 26px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(stat, pillX + 120, 978);
        pillX += 260;
      }

      // 10. Footer User Tag
      ctx.textAlign = 'left';
      ctx.fillStyle = '#8A8D94';
      ctx.font = '400 26px Inter, sans-serif';
      ctx.fillText(`Accomplished by ${userName} · Bunon Verified`, 90, 1230);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `bunon-photocard-${goalTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsExporting(false);
    }
  }, [goalTitle, userName, chapterBadge, activeSubtitle, storyLine, statPills]);

  return (
    <div className="flex flex-col items-center w-full">
      {/* 2-Pill Vibe Switch */}
      <div className="inline-flex items-center gap-1.5 p-1 bg-secondary-surface rounded-full mb-4">
        <button
          type="button"
          onClick={() => setVibe('WITTY')}
          className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-all ${
            vibe === 'WITTY'
              ? 'bg-[#1A1A1B] text-white dark:bg-[#EDEEEF] dark:text-[#0E0F11]'
              : 'text-muted hover:text-ink'
          }`}
        >
          Playful / Witty
        </button>
        <button
          type="button"
          onClick={() => setVibe('MINIMAL')}
          className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-all ${
            vibe === 'MINIMAL'
              ? 'bg-[#1A1A1B] text-white dark:bg-[#EDEEEF] dark:text-[#0E0F11]'
              : 'text-muted hover:text-ink'
          }`}
        >
          Clean & Minimal
        </button>
      </div>

      {/* 4:5 Portrait Preview Card */}
      <article className="w-full max-w-[340px] aspect-[4/5] bg-card rounded-[20px] border border-hairline p-5 relative overflow-hidden flex flex-col justify-between shadow-none">
        {/* Top-Right Marigold Seal */}
        <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#FFB020] text-white flex items-center justify-center text-[12px] font-bold select-none">
          ✓
        </div>

        {/* Zone 1 & 2: Header, Title, Subtitle */}
        <div>
          <div className="flex items-center gap-1.5 text-[12px] text-muted pr-8">
            <span className="font-semibold text-ink">Bunon</span>
            <span>·</span>
            <span>{chapterBadge}</span>
          </div>
          <h2 className="text-[18px] font-bold text-ink tracking-tight mt-2.5 truncate">
            {goalTitle}
          </h2>
          <p className="text-[13px] text-muted leading-relaxed mt-1 line-clamp-2">
            {activeSubtitle}
          </p>
        </div>

        {/* Zone 3: Side-by-side Proofs */}
        <div className="my-2 relative flex items-center justify-between gap-2">
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-[1px] bg-hairline z-0" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-3 h-3 rounded-full bg-[#FFB020]" />
          <div className="relative z-1 flex-1 bg-secondary-surface rounded-[12px] p-2 flex flex-col gap-1">
            <span className="text-[10px] text-muted">Day 1</span>
            <div className="w-full aspect-[4/3] rounded-[6px] bg-card flex items-center justify-center overflow-hidden">
              {proof1Url ? (
                <img src={proof1Url} alt="Day 1 proof" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-muted">Proof 1</span>
              )}
            </div>
          </div>
          <div className="relative z-1 flex-1 bg-secondary-surface rounded-[12px] p-2 flex flex-col gap-1">
            <span className="text-[10px] text-muted">Final</span>
            <div className="w-full aspect-[4/3] rounded-[6px] bg-card flex items-center justify-center overflow-hidden">
              {proof2Url ? (
                <img src={proof2Url} alt="Final proof" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-muted">Proof 2</span>
              )}
            </div>
          </div>
        </div>

        {/* Zone 4: Story & Stat Pills */}
        <div>
          <p className="text-[12px] text-ink font-medium leading-snug line-clamp-2">
            {storyLine}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            {statPills.map((stat) => (
              <span
                key={stat}
                className="px-2.5 py-1 bg-secondary-surface rounded-full text-[11px] font-medium text-ink"
              >
                {stat}
              </span>
            ))}
          </div>
        </div>
      </article>

      {/* Save Button */}
      <div className="w-full max-w-[340px] mt-4">
        <PrimaryButton onClick={handleDownload} disabled={isExporting}>
          <div className="flex items-center justify-center gap-2">
            <Download size={18} />
            <span>{isExporting ? 'Generating PNG...' : 'Share / Save Photocard (PNG)'}</span>
          </div>
        </PrimaryButton>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
