/**
 * 1. Purpose: Displays attached photo or link preview card with remove action.
 * 2. Spec Ref: Stitch create_proof Screen 40 Attachment Card.
 * 3. Called By: CreateProofView.
 * 4. Calls: Pure UI markup.
 */

'use client';

interface ProofPreviewCardProps {
  photoPreviewUrl: string | null;
  photoFileName: string;
  photoSizeBytes: number;
  linkUrl: string | null;
  onRemovePhoto: () => void;
  onRemoveLink: () => void;
}

export function ProofPreviewCard({
  photoPreviewUrl,
  photoFileName,
  photoSizeBytes,
  linkUrl,
  onRemovePhoto,
  onRemoveLink,
}: Readonly<ProofPreviewCardProps>) {
  if (photoPreviewUrl) {
    return (
      <div className="w-full bg-card rounded-[20px] border border-hairline/60 p-4 flex flex-col gap-3">
        <div className="relative w-full h-[140px] rounded-xl overflow-hidden bg-[var(--page)] flex items-center justify-center">
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
          <span className="shrink-0">{(photoSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
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
