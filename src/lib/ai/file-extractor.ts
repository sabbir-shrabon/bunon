import 'server-only';
/**
 * 1. Purpose: In-memory extract-and-discard validator and processor for onboarding context files.
 * 2. Spec Ref: Prompt Catalog v2.5 (Pipeline 1B) & Database Schema v2.5 (onboarding context limits).
 * 3. Called By: src/app/api/onboarding/ingest-context/route.ts.
 * 4. Calls: mammoth (docx extraction).
 */

import mammoth from 'mammoth';

export interface InlineMediaPart {
  mimeType: string;
  data: string; // base64
}

export interface ExtractedContextFile {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  extractedText?: string;
  inlinePart?: InlineMediaPart;
}

export interface FileExtractorLimits {
  maxFiles: number;
  maxFileSizeBytes: number;
}

export const DEFAULT_FILE_LIMITS: FileExtractorLimits = {
  maxFiles: 1,
  maxFileSizeBytes: 5242880, // 5 MB
};

const ALLOWED_MIME_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = ['.txt', '.md', '.docx', '.pdf', '.jpg', '.jpeg', '.png', '.webp'];

function getFileExtension(name: string): string {
  const dotIndex = name.lastIndexOf('.');
  return dotIndex !== -1 ? name.slice(dotIndex).toLowerCase() : '';
}

function resolveMimeType(file: File): string {
  const ext = getFileExtension(file.name);
  if (file.type && ALLOWED_MIME_TYPES.has(file.type)) {
    return file.type;
  }
  if (ext === '.txt') return 'text/plain';
  if (ext === '.md') return 'text/markdown';
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return file.type || 'application/octet-stream';
}

export async function processOnboardingFile(
  file: File,
  limits: FileExtractorLimits = DEFAULT_FILE_LIMITS
): Promise<ExtractedContextFile> {
  const ext = getFileExtension(file.name);
  const resolvedMime = resolveMimeType(file);

  if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_MIME_TYPES.has(resolvedMime)) {
    throw new Error('UNSUPPORTED_FILE_TYPE');
  }

  if (file.size > limits.maxFileSizeBytes) {
    throw new Error('FILE_TOO_LARGE');
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (ext === '.txt' || ext === '.md' || resolvedMime === 'text/plain' || resolvedMime === 'text/markdown') {
    const decoded = buffer.toString('utf-8');
    const capped = decoded.slice(0, 12000);
    return {
      fileName: file.name,
      mimeType: resolvedMime,
      fileSizeBytes: file.size,
      extractedText: capped,
    };
  }

  if (ext === '.docx' || resolvedMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    const capped = (result.value || '').slice(0, 12000);
    return {
      fileName: file.name,
      mimeType: resolvedMime,
      fileSizeBytes: file.size,
      extractedText: capped,
    };
  }

  if (ext === '.pdf' || resolvedMime === 'application/pdf' || resolvedMime.startsWith('image/')) {
    const base64Data = buffer.toString('base64');
    return {
      fileName: file.name,
      mimeType: resolvedMime,
      fileSizeBytes: file.size,
      inlinePart: {
        mimeType: resolvedMime,
        data: base64Data,
      },
    };
  }

  throw new Error('UNSUPPORTED_FILE_TYPE');
}
