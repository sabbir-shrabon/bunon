/**
 * 1. Purpose: 5-grid action buttons for adding camera, gallery, link, video, or file to proof.
 * 2. Spec Ref: Stitch create_proof Screen 40 Add-to-proof row.
 * 3. Called By: CreateProofView.
 * 4. Calls: Pure UI markup and callbacks.
 */

'use client';

interface ProofAddGridProps {
  onCameraClick: () => void;
  onGalleryClick: () => void;
  onLinkClick: () => void;
  onVideoClick: () => void;
  onFileClick: () => void;
}

export function ProofAddGrid({
  onCameraClick,
  onGalleryClick,
  onLinkClick,
  onVideoClick,
  onFileClick,
}: Readonly<ProofAddGridProps>) {
  return (
    <div className="w-full bg-card rounded-[20px] border border-hairline/60 p-5 flex flex-col gap-3">
      <div className="text-[12px] font-medium text-muted">Add to your proof</div>
      <div className="grid grid-cols-5 gap-2 w-full">
        {/* Camera */}
        <button
          type="button"
          onClick={onCameraClick}
          className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-[var(--page)] hover:bg-[var(--secondary-surface)] transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5 fill-none stroke-current stroke-2 text-ink" viewBox="0 0 24 24">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span className="mt-1 text-[12px] font-medium text-ink">Camera</span>
        </button>

        {/* Gallery */}
        <button
          type="button"
          onClick={onGalleryClick}
          className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-[var(--page)] hover:bg-[var(--secondary-surface)] transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5 fill-none stroke-current stroke-2 text-ink" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="mt-1 text-[12px] font-medium text-ink">Gallery</span>
        </button>

        {/* Link */}
        <button
          type="button"
          onClick={onLinkClick}
          className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-[var(--page)] hover:bg-[var(--secondary-surface)] transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5 fill-none stroke-current stroke-2 text-ink" viewBox="0 0 24 24">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span className="mt-1 text-[12px] font-medium text-ink">Link</span>
        </button>

        {/* Video (Pro) */}
        <button
          type="button"
          onClick={onVideoClick}
          className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-[var(--page)] hover:bg-[var(--secondary-surface)] transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5 fill-none stroke-current stroke-2 text-ink" viewBox="0 0 24 24">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <span className="mt-1 text-[12px] font-medium text-ink">Video</span>
          <span className="text-[10px] text-muted">Pro</span>
        </button>

        {/* File (Pro) */}
        <button
          type="button"
          onClick={onFileClick}
          className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-[var(--page)] hover:bg-[var(--secondary-surface)] transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5 fill-none stroke-current stroke-2 text-ink" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span className="mt-1 text-[12px] font-medium text-ink">File</span>
          <span className="text-[10px] text-muted">Pro</span>
        </button>
      </div>
    </div>
  );
}
