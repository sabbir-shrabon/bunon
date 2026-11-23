/**
 * 1. Purpose: API route handler generating 60s signed upload URLs for private proof files.
 * 2. Spec Ref: Database Schema v2.5 Section 4 & Category D Screens 39-49.
 * 3. Called By: Create proof screen (/proof/create) and Camera screen.
 * 4. Calls: createClient and evidence-service requestProofUploadUrl.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/db/server';
import { requestProofUploadUrl } from '@/lib/services/evidence-service';
import type { EvidenceType } from '@/types/domain';

const UploadUrlSchema = z.object({
  fileName: z.string().min(1).default('proof.jpg'),
  mimeType: z.string().default('image/jpeg'),
  fileSizeBytes: z.coerce.number().min(0).default(0),
  type: z.enum(['NOTE', 'LINK', 'PHOTO', 'VIDEO', 'FILE']).optional(),
  proofType: z.enum(['NOTE', 'LINK', 'PHOTO', 'VIDEO', 'FILE']).optional(),
  durationSeconds: z.coerce.number().min(0).optional(),
});

function getHumanReadableErrorMessage(code: string): string {
  switch (code) {
    case 'TASK_NOT_FOUND':
      return 'Task not found or does not belong to your active goal.';
    case 'USER_NOT_FOUND':
      return 'User profile not found.';
    case 'PRO_REQUIRED':
      return 'Video and file proofs are available on Bunon Pro.';
    case 'DAILY_PHOTO_LIMIT':
      return 'Free plan includes 1 photo proof per day. Upgrade to Pro for unlimited proofs.';
    case 'FILE_TOO_LARGE':
      return 'File size exceeds the 10 MB limit. Please select a smaller file.';
    case 'STORAGE_FULL':
      return 'Storage limit reached (50 MB on Free plan). Upgrade to Pro for 2 GB.';
    default:
      return code.toLowerCase().includes('bucket') || code.toLowerCase().includes('not found')
        ? 'Proof storage is temporarily unavailable. Please try again.'
        : code;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: taskId } = await params;

  let rawJson: unknown;
  try {
    rawJson = await request.json();
  } catch {
    console.error('[evidence/upload-url 400]', { code: 'INVALID_JSON', details: 'Malformed JSON payload' });
    return NextResponse.json({ error: 'INVALID_JSON', message: 'Malformed JSON payload' }, { status: 400 });
  }

  const parseResult = UploadUrlSchema.safeParse(rawJson);
  if (!parseResult.success) {
    const details = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    console.error('[evidence/upload-url 400]', { code: 'INVALID_PAYLOAD', details });
    return NextResponse.json({ error: 'INVALID_PAYLOAD', message: details }, { status: 400 });
  }

  const body = parseResult.data;
  const resolvedType = (body.type || body.proofType || 'PHOTO') as EvidenceType;

  const result = await requestProofUploadUrl(user.id, taskId, {
    fileName: body.fileName,
    mimeType: body.mimeType,
    fileSizeBytes: body.fileSizeBytes,
    type: resolvedType,
    proofType: resolvedType,
    durationSeconds: body.durationSeconds,
  });

  if (!result.success) {
    const code = result.error || 'UPLOAD_URL_FAILED';
    console.error('[evidence/upload-url 400]', { code, details: result.error });
    return NextResponse.json({
      error: code,
      message: getHumanReadableErrorMessage(code),
    }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    signedUrl: result.signedUrl,
    token: result.token,
    path: result.path,
    storagePath: result.path,
  });
}
