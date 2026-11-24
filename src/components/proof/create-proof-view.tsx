/**
 * 1. Purpose: Screen 40 (Create proof) client view supporting photo, link, note, and Pro video/file proofs.
 * 2. Spec Ref: Stitch create_proof code.html & screen.png & Category D Screens 39-49.
 * 3. Called By: /proof/create page.
 * 4. Calls: CameraModal, LinkSheet, ProofLimitSheet, ProofPreviewCard, ProofAddGrid, EffortCheckinCard, uploadProofAttachment.
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CameraModal } from './camera-modal';
import { LinkSheet } from './link-sheet';
import { ProofLimitSheet } from './proof-limit-sheets';
import { ProofPreviewCard } from './proof-preview-card';
import { ProofAddGrid } from './proof-add-grid';
import { EffortCheckinCard } from './effort-checkin-card';
import { compressPhoto } from './compress-photo';
import { uploadProofAttachment } from './upload-proof-photo';
import { PrimaryButton } from '@/components/ui/primary-button';

interface CreateProofViewProps {
  taskId: string;
  taskTitle: string;
  isPro?: boolean;
  maxFileSizeBytes?: number;
  maxVideoDurationSeconds?: number;
}

function readVideoDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? Math.ceil(video.duration) : undefined;
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    video.src = url;
  });
}

export function CreateProofView({
  taskId,
  taskTitle,
  isPro = false,
  maxFileSizeBytes = 10 * 1024 * 1024,
  maxVideoDurationSeconds = 30,
}: Readonly<CreateProofViewProps>) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [attachmentType, setAttachmentType] = useState<'PHOTO' | 'VIDEO' | 'FILE' | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string>('');
  const [photoSizeBytes, setPhotoSizeBytes] = useState<number>(0);
  const [videoDurationSeconds, setVideoDurationSeconds] = useState<number | undefined>(undefined);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);

  const [caption, setCaption] = useState('');
  const [effortRating, setEffortRating] = useState<'easy' | 'balanced' | 'hard' | null>(null);
  const [isEffortDismissed, setIsEffortDismissed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLinkSheetOpen, setIsLinkSheetOpen] = useState(false);
  const [limitSheetType, setLimitSheetType] = useState<'PHOTO_LIMIT_47' | 'PRO_LOCKED_48' | 'STORAGE_FULL_119' | null>(null);

  const clearAttachment = useCallback(() => {
    setPhotoPreviewUrl((prev) => {
      if (prev) { try { URL.revokeObjectURL(prev); } catch {} }
      return null;
    });
    setAttachmentType(null);
    setPhotoBlob(null);
    setPhotoFileName('');
    setPhotoSizeBytes(0);
    setVideoDurationSeconds(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (docInputRef.current) docInputRef.current.value = '';
  }, []);

  const clearProofState = useCallback(() => {
    clearAttachment();
    setLinkUrl(null);
    setCaption('');
    setEffortRating(null);
    setIsEffortDismissed(false);
    setIsSubmitting(false);
    setErrorMessage(null);
    try {
      sessionStorage.removeItem('camera_capture_cache');
      sessionStorage.removeItem('proof_draft_cache');
    } catch {}
  }, [clearAttachment]);

  useEffect(() => {
    clearProofState();
    return () => clearProofState();
  }, [taskId, clearProofState]);

  const handlePhotoCompressed = async (file: Blob, name: string) => {
    setErrorMessage(null);
    const compressed = await compressPhoto(file);
    clearAttachment();
    setAttachmentType('PHOTO');
    setPhotoBlob(compressed);
    setPhotoSizeBytes(compressed.size);
    setPhotoFileName(name);
    setPhotoPreviewUrl(URL.createObjectURL(compressed));
    setLinkUrl(null);
  };

  const handleVideoSelected = async (file: File) => {
    setErrorMessage(null);
    if (file.size > maxFileSizeBytes) {
      setErrorMessage(`Video exceeds the ${Math.max(1, Math.round(maxFileSizeBytes / (1024 * 1024)))} MB file limit.`);
      return;
    }
    const duration = await readVideoDuration(file);
    if (typeof duration === 'number' && duration > maxVideoDurationSeconds) {
      setErrorMessage(`Video exceeds the ${maxVideoDurationSeconds}s limit.`);
      return;
    }
    clearAttachment();
    setAttachmentType('VIDEO');
    setPhotoBlob(file);
    setPhotoSizeBytes(file.size);
    setPhotoFileName(file.name);
    setVideoDurationSeconds(duration);
    setPhotoPreviewUrl(URL.createObjectURL(file));
    setLinkUrl(null);
  };

  const handleDocSelected = (file: File) => {
    setErrorMessage(null);
    if (file.size > maxFileSizeBytes) {
      setErrorMessage(`File exceeds the ${Math.max(1, Math.round(maxFileSizeBytes / (1024 * 1024)))} MB file limit.`);
      return;
    }
    clearAttachment();
    setAttachmentType('FILE');
    setPhotoBlob(file);
    setPhotoSizeBytes(file.size);
    setPhotoFileName(file.name);
    setPhotoPreviewUrl(null);
    setLinkUrl(null);
  };

  const handleSubmit = async () => {
    if (!photoBlob && !linkUrl && !caption.trim()) {
      setErrorMessage('Please add a photo, file, link, or note explaining your work');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let storagePath: string | undefined;
      const mediaType = attachmentType || (photoBlob ? 'PHOTO' : null);

      if (photoBlob && mediaType) {
        const uploadResult = await uploadProofAttachment(
          taskId,
          photoBlob,
          photoFileName,
          photoSizeBytes,
          mediaType,
          videoDurationSeconds
        );
        if (uploadResult.errorType) {
          setLimitSheetType(uploadResult.errorType);
          setIsSubmitting(false);
          return;
        }
        if (uploadResult.errorMessage || !uploadResult.storagePath) {
          setErrorMessage(uploadResult.errorMessage || 'Proof upload failed');
          setIsSubmitting(false);
          return;
        }
        storagePath = uploadResult.storagePath;
      }

      const proofType = mediaType || (linkUrl ? 'LINK' : 'NOTE');
      const completeRes = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: proofType,
          storagePath,
          externalUrl: linkUrl,
          fileSizeBytes: photoSizeBytes || photoBlob?.size || 0,
          durationSeconds: videoDurationSeconds,
          captionNote: caption.trim() || undefined,
          effortRating: effortRating || undefined,
        }),
      });

      if (!completeRes.ok) {
        const err = await completeRes.json().catch(() => ({}));
        setErrorMessage(err.message || err.error || 'Could not complete task');
        setIsSubmitting(false);
        return;
      }

      clearProofState();
      router.push(`/today?completed=${taskId}`);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Network error while saving proof');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--page)] text-ink">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handlePhotoCompressed(f, f.name);
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleVideoSelected(f);
        }}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.zip,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleDocSelected(f);
        }}
      />

      <header className="fixed top-0 inset-x-0 z-40 bg-card/90 backdrop-blur-md border-b border-hairline/60 pt-safe">
        <div className="h-14 px-4 flex items-center justify-between max-w-[640px] mx-auto">
          <button type="button" aria-label="Go back" onClick={() => router.back()} className="w-10 h-10 -ml-2 flex items-center justify-center text-ink hover:text-muted transition-colors cursor-pointer">
            <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          </button>
          <h1 className="text-[17px] font-semibold text-ink text-center flex-1 px-2 truncate">Create Proof</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full max-w-[640px] mx-auto pt-18 pb-28 px-4 gap-4">
        <div className="text-[12px] text-muted truncate px-1">
          Finishing: <span className="font-semibold text-ink">{taskTitle}</span>
        </div>

        <ProofPreviewCard
          attachmentType={attachmentType}
          photoPreviewUrl={photoPreviewUrl}
          photoFileName={photoFileName}
          photoSizeBytes={photoSizeBytes}
          durationSeconds={videoDurationSeconds}
          linkUrl={linkUrl}
          onRemovePhoto={clearAttachment}
          onRemoveLink={() => setLinkUrl(null)}
        />

        <div className="w-full bg-card rounded-[20px] border border-hairline/60 p-5 flex flex-col">
          <textarea
            rows={4}
            maxLength={280}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What did you do, in one or two lines?"
            className="w-full bg-transparent text-ink placeholder:text-muted text-[15px] resize-none border-0 outline-none p-0 focus:ring-0 leading-relaxed"
          />
          <div className="flex items-center justify-between pt-2 border-t border-hairline/40 text-[12px] text-muted">
            <span>Markdown supported</span>
            <span>{caption.length} / 280</span>
          </div>
        </div>

        <ProofAddGrid
          isPro={isPro}
          onCameraClick={() => setIsCameraOpen(true)}
          onGalleryClick={() => fileInputRef.current?.click()}
          onLinkClick={() => setIsLinkSheetOpen(true)}
          onVideoClick={() => {
            if (isPro) videoInputRef.current?.click();
            else setLimitSheetType('PRO_LOCKED_48');
          }}
          onFileClick={() => {
            if (isPro) docInputRef.current?.click();
            else setLimitSheetType('PRO_LOCKED_48');
          }}
        />

        {!isEffortDismissed && (
          <EffortCheckinCard effortRating={effortRating} onSelectRating={setEffortRating} onDismiss={() => setIsEffortDismissed(true)} />
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-[13px] text-red-600 px-4 text-center leading-relaxed">
            {errorMessage}
          </div>
        )}
      </main>

      <aside className="fixed bottom-0 inset-x-0 z-40 bg-card/90 backdrop-blur-md border-t border-hairline/60 pb-safe">
        <div className="h-20 px-4 flex items-center justify-center max-w-[640px] mx-auto">
          <PrimaryButton onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving proof…' : 'Save proof and finish'}
          </PrimaryButton>
        </div>
      </aside>

      <CameraModal
        isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)}
        onCapture={(blob, previewUrl) => {
          clearAttachment();
          setAttachmentType('PHOTO');
          setPhotoBlob(blob); setPhotoSizeBytes(blob.size); setPhotoFileName('camera_snapshot.jpg');
          setPhotoPreviewUrl(previewUrl); setLinkUrl(null); setIsCameraOpen(false);
        }}
      />
      <LinkSheet isOpen={isLinkSheetOpen} onClose={() => setIsLinkSheetOpen(false)} onAddLink={(url) => { setLinkUrl(url); clearAttachment(); }} />
      <ProofLimitSheet isOpen={Boolean(limitSheetType)} type={limitSheetType || 'PHOTO_LIMIT_47'} onClose={() => setLimitSheetType(null)} onUseNoteOrLink={() => setLimitSheetType(null)} />
    </div>
  );
}
