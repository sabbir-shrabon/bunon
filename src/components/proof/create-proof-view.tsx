/**
 * 1. Purpose: Screen 40 (Create proof) client view matching create_proof Stitch design faithfully.
 * 2. Spec Ref: Stitch create_proof code.html & screen.png & Category D Screens 39-49.
 * 3. Called By: /proof/create page.
 * 4. Calls: CameraModal, LinkSheet, ProofLimitSheet, ProofPreviewCard, ProofAddGrid, EffortCheckinCard, compressPhoto.
 */

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CameraModal } from './camera-modal';
import { LinkSheet } from './link-sheet';
import { ProofLimitSheet } from './proof-limit-sheets';
import { ProofPreviewCard } from './proof-preview-card';
import { ProofAddGrid } from './proof-add-grid';
import { EffortCheckinCard } from './effort-checkin-card';
import { compressPhoto } from './compress-photo';
import { PrimaryButton } from '@/components/ui/primary-button';
import { createClient } from '@/lib/db/client';

interface CreateProofViewProps {
  taskId: string;
  taskTitle: string;
  isPro?: boolean;
}

export function CreateProofView({
  taskId,
  taskTitle,
  isPro = false,
}: Readonly<CreateProofViewProps>) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string>('');
  const [photoSizeBytes, setPhotoSizeBytes] = useState<number>(0);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);

  const [caption, setCaption] = useState('');
  const [effortRating, setEffortRating] = useState<'easy' | 'balanced' | 'hard' | null>(null);
  const [isEffortDismissed, setIsEffortDismissed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDonePop, setShowDonePop] = useState(false);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLinkSheetOpen, setIsLinkSheetOpen] = useState(false);
  const [limitSheetType, setLimitSheetType] = useState<'PHOTO_LIMIT_47' | 'PRO_LOCKED_48' | 'STORAGE_FULL_119' | null>(null);

  const handlePhotoCompressed = async (file: Blob, name: string) => {
    const compressed = await compressPhoto(file);
    setPhotoBlob(compressed);
    setPhotoSizeBytes(compressed.size);
    setPhotoFileName(name);
    setPhotoPreviewUrl(URL.createObjectURL(compressed));
    setLinkUrl(null);
  };

  const handleSubmit = async () => {
    if (!photoBlob && !linkUrl && !caption.trim()) {
      setErrorMessage('Please add a photo, link, or note explaining your work');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let storagePath: string | undefined;

      if (photoBlob) {
        const mimeType = photoBlob.type || 'image/jpeg';
        const fileSizeBytes = photoSizeBytes || photoBlob.size || 0;
        const uploadRes = await fetch(`/api/tasks/${taskId}/evidence/upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: photoFileName || 'proof.jpg',
            mimeType,
            fileSizeBytes,
            type: 'PHOTO',
            proofType: 'PHOTO',
          }),
        });
        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          if (uploadData.error === 'DAILY_PHOTO_LIMIT') {
            setLimitSheetType('PHOTO_LIMIT_47');
            return;
          }
          if (uploadData.error === 'STORAGE_FULL') {
            setLimitSheetType('STORAGE_FULL_119');
            return;
          }
          if (uploadData.error === 'PRO_REQUIRED') {
            setLimitSheetType('PRO_LOCKED_48');
            return;
          }
          setErrorMessage(uploadData.message || uploadData.error || 'Failed to initialize photo upload');
          return;
        }

        const targetPath = uploadData.path || uploadData.storagePath;
        if (!targetPath) {
          setErrorMessage('Photo upload failed: missing storage path');
          return;
        }

        if (uploadData.token) {
          const supabase = createClient();
          const { error: uploadError } = await supabase.storage
            .from('bunon-proofs')
            .uploadToSignedUrl(targetPath, uploadData.token, photoBlob, {
              contentType: mimeType,
              upsert: true,
            });

          if (uploadError) {
            console.error('[proof storage upload error]', uploadError);
            setErrorMessage(`Could not save photo to storage: ${uploadError.message}`);
            return;
          }
        } else if (uploadData.signedUrl) {
          const putRes = await fetch(uploadData.signedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': mimeType },
            body: photoBlob,
          });

          if (!putRes.ok) {
            setErrorMessage(`Could not save photo to storage (${putRes.status}: ${putRes.statusText || 'Upload failed'})`);
            return;
          }
        } else {
          setErrorMessage('Photo upload failed: missing upload token or signed URL');
          return;
        }

        storagePath = targetPath;
      }

      if (photoBlob && !storagePath) {
        setErrorMessage('Cannot complete task: photo upload failed to produce a valid storage path');
        return;
      }

      const proofType = photoBlob ? 'PHOTO' : linkUrl ? 'LINK' : 'NOTE';
      const completeRes = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: proofType,
          storagePath,
          externalUrl: linkUrl,
          fileSizeBytes: photoSizeBytes || photoBlob?.size || 0,
          captionNote: caption.trim() || undefined,
          effortRating: effortRating || undefined,
        }),
      });

      if (!completeRes.ok) {
        const err = await completeRes.json().catch(() => ({}));
        setErrorMessage(err.message || err.error || 'Could not complete task');
        return;
      }

      setShowDonePop(true);
      setTimeout(() => {
        router.push(`/today?completed=${taskId}`);
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error while saving proof';
      setErrorMessage(msg);
    } finally {
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
          if (f) handlePhotoCompressed(f, f.name);
        }}
      />

      {showDonePop && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="flex flex-col items-center animate-in fade-in zoom-in-75 duration-300">
            <div className="w-16 h-16 rounded-full bg-[var(--marigold)] text-white flex items-center justify-center text-[28px] shadow-lg">
              ✓
            </div>
            <span className="mt-3 text-white text-[16px] font-semibold">Saved & Finished</span>
          </div>
        </div>
      )}

      <header className="fixed top-0 inset-x-0 z-40 bg-card/90 backdrop-blur-md border-b border-hairline/60 pt-safe">
        <div className="h-14 px-4 flex items-center justify-between max-w-[640px] mx-auto">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => router.back()}
            className="w-10 h-10 -ml-2 flex items-center justify-center text-ink hover:text-muted transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
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
          photoPreviewUrl={photoPreviewUrl}
          photoFileName={photoFileName}
          photoSizeBytes={photoSizeBytes}
          linkUrl={linkUrl}
          onRemovePhoto={() => { setPhotoBlob(null); setPhotoPreviewUrl(null); }}
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
          onCameraClick={() => setIsCameraOpen(true)}
          onGalleryClick={() => fileInputRef.current?.click()}
          onLinkClick={() => setIsLinkSheetOpen(true)}
          onVideoClick={() => setLimitSheetType('PRO_LOCKED_48')}
          onFileClick={() => setLimitSheetType('PRO_LOCKED_48')}
        />

        {!isEffortDismissed && (
          <EffortCheckinCard
            effortRating={effortRating}
            onSelectRating={setEffortRating}
            onDismiss={() => setIsEffortDismissed(true)}
          />
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
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(blob, previewUrl) => {
          setPhotoBlob(blob);
          setPhotoSizeBytes(blob.size);
          setPhotoFileName('camera_snapshot.jpg');
          setPhotoPreviewUrl(previewUrl);
          setLinkUrl(null);
          setIsCameraOpen(false);
        }}
      />

      <LinkSheet
        isOpen={isLinkSheetOpen}
        onClose={() => setIsLinkSheetOpen(false)}
        onAddLink={(url) => { setLinkUrl(url); setPhotoBlob(null); setPhotoPreviewUrl(null); }}
      />

      <ProofLimitSheet
        isOpen={Boolean(limitSheetType)}
        type={limitSheetType || 'PHOTO_LIMIT_47'}
        onClose={() => setLimitSheetType(null)}
        onUseNoteOrLink={() => setLimitSheetType(null)}
      />
    </div>
  );
}
