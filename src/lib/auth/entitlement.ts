/**
 * 1. Purpose: Shared client- and server-safe helpers for evaluating live Pro entitlement.
 * 2. Spec Ref: Database Schema v2.5 Section 5 Table 1 (users.pro_until > NOW()).
 * 3. Called By: Shell components, /pro, /onboarding, /proof/create, firewall, and services.
 * 4. Calls: Standard Date API.
 */

export function isUserProActive(proUntil: string | null | undefined): boolean {
  if (!proUntil) return false;
  const expiryMs = new Date(proUntil).getTime();
  return Number.isFinite(expiryMs) && expiryMs > Date.now();
}

export function formatProExpiryDate(
  proUntil: string | null | undefined,
  language: 'EN' | 'BN' = 'EN'
): string | null {
  if (!isUserProActive(proUntil) || !proUntil) return null;
  const date = new Date(proUntil);
  return date.toLocaleDateString(language === 'BN' ? 'bn-BD' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
