/**
 * 1. Purpose: Displays attached photo, video, file, or link preview card with remove action.
 * 2. Spec Ref: Stitch create_proof Screen 40 Attachment Card.
 * 3. Called By: CreateProofView.
 * 4. Calls: Pure UI markup.
 */

'use client';

interface ProofPreviewCardProps {
  attachmentType?: 'PHOTO' | 'VIDEO' | 'FILE' | null;
  photoPreviewUrl: string | null;
  photoFileName: string;
  photoSizeBytes: number;
  durationSeconds?: number;
  linkUrl: string | null;
  onRemovePhoto: () => void;
  onRemoveLink: () => void;
}

export function ProofPreviewCard({
  attachmentType = 'PHOTO',
  photoPreviewUrl,
  photoFileName,
  photoSizeBytes,
  durationSeconds,
  linkUrl,
  onRemovePhoto,
  onRemoveLink,
}: Readonly<ProofPreviewCardProps>) {
  const sizeLabel =
    photoSizeBytes < 1024 * 1024
      ? `${Math.max(1, Math.round(photoSizeBytes / 1024))} KB`
      : `${(photoSizeBytes / (1024 * 1024)).toFixed(1)} MB`;

  if (attachmentType === 'VIDEO' && photoPreviewUrl) {
    return (
      <div className="w-full bg-card rounded-[20px] border border-hairline/60 p-4 flex flex-col gap-3">
        <div className="relative w-full h-[180px] rounded-xl overflow-hidden bg-[var(--page)] flex items-center justify-center">
          <video
            src={photoPreviewUrl}
            controls
            playsInline
            className="w-full h-full object-contain"
          />
          <button
            type="button"
            aria-label="Remove video"
            onClick={onRemovePhoto}
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-card flex items-center justify-center text-ink hover:bg-[var(--secondary-surface)] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="flex items-center justify-between text-[13px] text-muted px-1">
          <span className="font-medium text-ink truncate">{photoFileName || 'Video proof'}</span>
          <span className="shrink-0">
            {typeof durationSeconds === 'number' ? `${durationSeconds}s · ` : ''}
            {sizeLabel}
          </span>
        </div>
      </div>
    );
  }

  if (attachmentType === 'FILE' && photoFileName) {
    return (
      <div className="w-full bg-card rounded-[20px] border border-hairline/60 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[var(--secondary-surface)] flex items-center justify-center text-ink shrink-0 text-xs font-semibold">
            DOC
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-ink truncate">{photoFileName}</p>
            <p className="text-[11px] text-muted">{sizeLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemovePhoto}
          className="text-[12px] text-muted hover:text-ink cursor-pointer shrink-0"
        >
          Remove
        </button>
      </div>
    );
  }

  if (photoPreviewUrl) {
    return (
      <div className="w-full bg-card rounded-[20px] border border-hairline/60 p-4 flex flex-col gap-3">
        <div className="relative w-full h-[140px] rounded-xl overflow-hidden bg-[var(--page)] flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoPreviewUrl}
            alt="Proof preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            aria-label="Remove photo"
            onClick={onRemovePhoto}
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-card flex items-center justify-center text-ink hover:bg-[var(--secondary-surface)] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="flex items-center justify-between text-[13px] text-muted px-1">
          <span className="font-medium text-ink truncate">{photoFileName || 'Photo proof'}</span>
          <span className="shrink-0">{sizeLabel}</span>
        </div>
      </div>
    );
  }

  if (linkUrl) {
    return (
      <div className="w-full bg-card rounded-[20px] border border-hairline/60 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <span className="text-[18px]">🔗</span>
          <span className="text-[13px] font-medium text-ink truncate">{linkUrl}</span>
        </div>
        <button
          type="button"
          onClick={onRemoveLink}
          className="text-[12px] text-muted hover:text-ink cursor-pointer shrink-0"
        >
          Remove
        </button>
      </div>
    );
  }

  return null;
}
