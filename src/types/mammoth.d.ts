/**
 * 1. Purpose: TypeScript ambient declaration for mammoth .docx text extraction library.
 * 2. Spec Ref: Step A file extractor (in-memory .docx parsing).
 * 3. Called By: src/lib/ai/file-extractor.ts.
 * 4. Calls: none.
 */

declare module 'mammoth' {
  export interface MammothMessage {
    type: string;
    message: string;
  }

  export interface MammothResult {
    value: string;
    messages: MammothMessage[];
  }

  export function extractRawText(input: { buffer: Buffer }): Promise<MammothResult>;
}
