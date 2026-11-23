/**
 * 1. Purpose: Exposes the request platform normalized by middleware to Server Components.
 * 2. Spec Ref: Milestone 2 Middleware and Play Store platform detection.
 * 3. Called By: Platform-aware server-rendered application code.
 * 4. Calls: next/headers.
 */

import { headers } from 'next/headers';

export type BunonPlatform = 'play-store' | 'web';

export async function usePlatform(): Promise<BunonPlatform> {
  const requestHeaders = await headers();
  return requestHeaders.get('x-bunon-platform') === 'play-store' ? 'play-store' : 'web';
}
