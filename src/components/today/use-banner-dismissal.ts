/**
 * 1. Purpose: Persists daily contextual banner dismissal per goal and calendar day in localStorage.
 * 2. Spec Ref: Stitch State 24 (Welcome Back) and Today contextual banner dismissal contract.
 * 3. Called By: TodayView component.
 * 4. Calls: React hooks and window.localStorage.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export function useDailyBannerDismissal(goalId?: string): [boolean, () => void] {
  const [dismissed, setDismissed] = useState(false);
  const todayKey = new Date().toLocaleDateString('en-CA');
  const storageKey = goalId ? `bunon_banner_dismissed:${goalId}:${todayKey}` : null;

  useEffect(() => {
    if (!storageKey) {
      setDismissed(false);
      return;
    }
    try {
      setDismissed(window.localStorage.getItem(storageKey) === '1');
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, '1');
    } catch {
      // Ignore storage quota or private-browsing restrictions
    }
  }, [storageKey]);

  return [dismissed, dismiss];
}
