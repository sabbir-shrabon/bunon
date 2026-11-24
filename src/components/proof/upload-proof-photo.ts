/**
 * 1. Purpose: Uploads compressed proof image blob to Supabase storage via signed upload URL.
 * 2. Spec Ref: Stitch create_proof Screen 40 & Category D Proof.
 * 3. Called By: CreateProofView.
 * 4. Calls: /api/tasks/[id]/evidence/upload-url, Supabase storage client or PUT upload.
 */

import { createClient } from '@/lib/db/client';

export interface UploadProofPhotoResult {
  storagePath?: string;
  errorType?: 'PHOTO_LIMIT_47' | 'PRO_LOCKED_48' | 'STORAGE_FULL_119';
  errorMessage?: string;
}

export async function uploadProofPhoto(
  taskId: string,
  photoBlob: Blob,
  fileName: string,
  fileSizeBytes: number
): Promise<UploadProofPhotoResult> {
  const mimeType = photoBlob.type || 'image/jpeg';
  const size = fileSizeBytes || photoBlob.size || 0;

  const uploadRes = await fetch(`/api/tasks/${taskId}/evidence/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: fileName || 'proof.jpg',
      mimeType,
      fileSizeBytes: size,
      type: 'PHOTO',
      proofType: 'PHOTO',
    }),
  });

  const uploadData = await uploadRes.json().catch(() => ({}));

  if (!uploadRes.ok) {
    if (uploadData.error === 'DAILY_PHOTO_LIMIT') return { errorType: 'PHOTO_LIMIT_47' };
    if (uploadData.error === 'STORAGE_FULL') return { errorType: 'STORAGE_FULL_119' };
    if (uploadData.error === 'PRO_REQUIRED') return { errorType: 'PRO_LOCKED_48' };
    return { errorMessage: uploadData.message || uploadData.error || 'Failed to initialize photo upload' };
  }

  const targetPath = uploadData.path || uploadData.storagePath;
  if (!targetPath) return { errorMessage: 'Photo upload failed: missing storage path' };

  if (uploadData.token) {
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from('bunon-proofs')
      .uploadToSignedUrl(targetPath, uploadData.token, photoBlob, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      return { errorMessage: `Could not save photo to storage: ${uploadError.message}` };
    }
  } else if (uploadData.signedUrl) {
    const putRes = await fetch(uploadData.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': mimeType },
      body: photoBlob,
    });

    if (!putRes.ok) {
      return { errorMessage: `Could not save photo to storage (${putRes.status}: ${putRes.statusText || 'Upload failed'})` };
    }
  } else {
    return { errorMessage: 'Photo upload failed: missing upload token or signed URL' };
  }

  return { storagePath: targetPath };
}
