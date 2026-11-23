/**
 * 1. Purpose: Reads the current browser session for shell presentation without blocking guest entry.
 * 2. Spec Ref: Milestone 2 Direct Guest Entry and Frictionless Auth requirements.
 * 3. Called By: AppShell and guest entry action.
 * 4. Calls: Browser Supabase client.
 */

'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/db/client';

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, ready };
}
