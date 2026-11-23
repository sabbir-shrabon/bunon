/**
 * 1. Purpose: Beat 2 (Prove to finish) camera-first snapshot row connecting from Beat 1 thread.
 * 2. Spec Ref: Stitch today_cleanest_2_beat_thread Screen 22 Beat 2.
 * 3. Called By: HeroTaskCard in Today view.
 * 4. Calls: Pure UI markup and callbacks for camera and note/link modes.
 */

'use client';

interface BeatTwoProveProps {
  doneMeans: string;
  onCameraClick: () => void;
  onNoteLinkClick: () => void;
}

export function BeatTwoProve({
  doneMeans,
  onCameraClick,
  onNoteLinkClick,
}: Readonly<BeatTwoProveProps>) {
  return (
    <div className="relative z-10 flex items-center gap-3.5 p-3.5 bg-[var(--page)] rounded-xl border border-hairline/40 transition-colors">
      {/* 40px dark Camera circle */}
      <button
        type="button"
        aria-label="Snap proof with camera"
        onClick={onCameraClick}
        className="w-10 h-10 rounded-full bg-ink text-[var(--card)] flex items-center justify-center flex-shrink-0 active:scale-95 hover:opacity-90 transition-all cursor-pointer shadow-none"
      >
        <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>

      {/* Center metadata */}
      <div className="flex-1 min-w-0" onClick={onCameraClick} role="button" tabIndex={0}>
        <div className="text-[14px] font-semibold text-ink leading-snug truncate">
          Snap proof to finish
        </div>
        <div className="text-[13px] text-muted truncate leading-snug">
          {doneMeans || 'Photo of your working screen'}
        </div>
      </div>

      {/* Note / link text button */}
      <button
        type="button"
        onClick={onNoteLinkClick}
        className="text-[12px] font-medium text-muted hover:text-ink underline-offset-2 hover:underline flex-shrink-0 transition-colors cursor-pointer"
      >
        Note / link
      </button>
    </div>
  );
}
