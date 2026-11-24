/**
 * 1. Purpose: Uploads proof photo, video, or file attachment to Supabase storage via signed upload URL.
 * 2. Spec Ref: Stitch create_proof Screen 40 & Category D Proof.
 * 3. Called By: CreateProofView.
 * 4. Calls: /api/tasks/[id]/evidence/upload-url, Supabase storage client or PUT upload.
 */

import { createClient } from '@/lib/db/client';

export interface UploadProofResult {
  storagePath?: string;
  errorType?: 'PHOTO_LIMIT_47' | 'PRO_LOCKED_48' | 'STORAGE_FULL_119';
  errorMessage?: string;
}

export type UploadProofPhotoResult = UploadProofResult;

export async function uploadProofAttachment(
  taskId: string,
  blob: Blob,
  fileName: string,
  fileSizeBytes: number,
  proofType: 'PHOTO' | 'VIDEO' | 'FILE' = 'PHOTO',
  durationSeconds?: number
): Promise<UploadProofResult> {
  const defaultMime =
    proofType === 'VIDEO'
      ? 'video/mp4'
      : proofType === 'FILE'
        ? 'application/octet-stream'
        : 'image/jpeg';
  const mimeType = blob.type || defaultMime;
  const size = fileSizeBytes || blob.size || 0;

  const uploadRes = await fetch(`/api/tasks/${taskId}/evidence/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: fileName || (proofType === 'VIDEO' ? 'proof.mp4' : proofType === 'FILE' ? 'proof.pdf' : 'proof.jpg'),
      mimeType,
      fileSizeBytes: size,
      type: proofType,
      proofType,
      ...(typeof durationSeconds === 'number' ? { durationSeconds } : {}),
    }),
  });

  const uploadData = await uploadRes.json().catch(() => ({}));

  if (!uploadRes.ok) {
    if (uploadData.error === 'DAILY_PHOTO_LIMIT') return { errorType: 'PHOTO_LIMIT_47' };
    if (uploadData.error === 'STORAGE_FULL') return { errorType: 'STORAGE_FULL_119' };
    if (uploadData.error === 'PRO_REQUIRED') return { errorType: 'PRO_LOCKED_48' };
    return { errorMessage: uploadData.message || uploadData.error || 'Failed to initialize proof upload' };
  }

  const targetPath = uploadData.path || uploadData.storagePath;
  if (!targetPath) return { errorMessage: 'Upload failed: missing storage path' };

  if (uploadData.token) {
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from('bunon-proofs')
      .uploadToSignedUrl(targetPath, uploadData.token, blob, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      return { errorMessage: `Could not save proof to storage: ${uploadError.message}` };
    }
  } else if (uploadData.signedUrl) {
    const putRes = await fetch(uploadData.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': mimeType },
      body: blob,
    });

    if (!putRes.ok) {
      return { errorMessage: `Could not save proof to storage (${putRes.status}: ${putRes.statusText || 'Upload failed'})` };
    }
  } else {
    return { errorMessage: 'Upload failed: missing upload token or signed URL' };
  }

  return { storagePath: targetPath };
}

export async function uploadProofPhoto(
  taskId: string,
  photoBlob: Blob,
  fileName: string,
  fileSizeBytes: number
): Promise<UploadProofPhotoResult> {
  return uploadProofAttachment(taskId, photoBlob, fileName, fileSizeBytes, 'PHOTO');
}
