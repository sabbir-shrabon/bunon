/**
 * 1. Purpose: Centralized security, anti-phishing, and input sanitization helpers.
 * 2. Spec Ref: Security, Anti-Phishing & Repo Hygiene Audit contract.
 * 3. Called By: Proxy pipeline, auth components, evidence services, and link renderers.
 * 4. Calls: Pure regex & string sanitization.
 */

/**
 * Enforces a strict open-redirect / anti-phishing guard for return paths (?next=).
 * - Matches strictly relative internal paths starting with a single '/' not followed by '/' or '\'.
 * - Blocks 'https://evil.com', 'http://evil.com', '//evil.com', '/\evil.com', 'javascript:', 'data:', etc.
 * - Defaults safely to fallback (default: '/today').
 */
export function sanitizeRedirect(
  value: string | null | undefined,
  fallback = '/today'
): string {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();

  // Must start with exactly one '/' and NOT followed by another '/' or '\'
  const isSafeRelative =
    /^\/(?!\/|[\\|])/.test(trimmed) &&
    !trimmed.includes('\\') &&
    !trimmed.toLowerCase().startsWith('/\\');

  return isSafeRelative ? trimmed : fallback;
}

/**
 * Validates and sanitizes external proof links (external_url).
 * - Strictly requires http:// or https:// protocol.
 * - Blocks 'javascript:', 'data:', 'vbscript:', file URLs, protocol-relative '//', and relative paths.
 * - Returns the trimmed URL if valid, or null if invalid or unsafe.
 */
export function safeExternalUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();

  // Strictly match http:// or https://
  if (/^https?:\/\/[^\s]+$/i.test(trimmed)) {
    return trimmed;
  }

  return null;
}
