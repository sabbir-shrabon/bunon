/**
 * 1. Purpose: Re-exports platform detection for imports under the platform folder.
 * 2. Spec Ref: Milestone 2 Middleware and Play Store platform detection.
 * 3. Called By: Platform-aware server components and helpers.
 * 4. Calls: src/lib/platform.ts.
 */

export { usePlatform, type BunonPlatform } from '../platform';
