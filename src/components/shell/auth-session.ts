/**
 * 1. Purpose: Reads the current browser session, live Pro entitlement, and account/maintenance state.
 * 2. Spec Ref: Milestone 2 Direct Guest Entry, Screen 118, Screen 122, and Pro entitlement sync.
 * 3. Called By: AppShell, GoalSwitcherSheet, and client views.
 * 4. Calls: Browser Supabase client and /api/account/status.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/db/client';
import { isUserProActive } from '@/lib/auth/entitlement';
import type { UserStatus } from '@/types/domain';

interface AccountStatusPayload {
  authenticated: boolean;
  status: UserStatus | null;
  proUntil: string | null;
  isPro: boolean;
  maintenanceMode: boolean;
  aiKillSwitch: boolean;
}

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [proUntil, setProUntil] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<UserStatus | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [aiKillSwitch, setAiKillSwitch] = useState(false);

  const refreshLiveStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/account/status', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as AccountStatusPayload;
      setProUntil(data.proUntil ?? null);
      setAccountStatus(data.status ?? null);
      setMaintenanceMode(Boolean(data.maintenanceMode));
      setAiKillSwitch(Boolean(data.aiKillSwitch));
    } catch {
      // Keep existing state on transient network failure
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
      void refreshLiveStatus();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      void refreshLiveStatus();
    });

    const handleFocus = () => {
      void refreshLiveStatus();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshLiveStatus]);

  return {
    user,
    ready,
    proUntil,
    isPro: isUserProActive(proUntil),
    accountStatus,
    maintenanceMode,
    aiKillSwitch,
    refreshLiveStatus,
  };
}
