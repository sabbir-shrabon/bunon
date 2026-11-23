/**
 * 1. Purpose: Persists guest and signed-in theme and language preferences across the application.
 * 2. Spec Ref: Milestone 2 Design System, Drawer 69, and public.users preferences.
 * 3. Called By: src/app/layout.tsx and shell preference controls.
 * 4. Calls: Browser Supabase client and localStorage.
 */

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createClient } from '@/lib/db/client';
import type { AppLanguage } from './digits';

type Theme = 'LIGHT' | 'DARK';

type Preferences = {
  theme: Theme;
  language: AppLanguage;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: AppLanguage) => void;
};

const PreferencesContext = createContext<Preferences | null>(null);

function applyTheme(theme: Theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'DARK');
  }
}

export function AppPreferencesProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [theme, setThemeState] = useState<Theme>('LIGHT');
  const [language, setLanguageState] = useState<AppLanguage>('EN');

  useEffect(() => {
    const storedTheme = localStorage.getItem('bunon.theme');
    const storedLanguage = localStorage.getItem('bunon.language');
    const nextTheme: Theme = storedTheme === 'DARK' ? 'DARK' : 'LIGHT';
    const nextLanguage: AppLanguage = storedLanguage === 'BN' ? 'BN' : 'EN';

    setThemeState(nextTheme);
    setLanguageState(nextLanguage);
    applyTheme(nextTheme);
  }, []);

  const save = useCallback(
    async (next: Partial<{ theme: Theme; language: AppLanguage }>) => {
      Object.entries(next).forEach(([key, value]) =>
        localStorage.setItem(`bunon.${key}`, value)
      );

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase.from('users').update(next).eq('id', user.id);
        }
      } catch {
        // Guest preferences remain available locally.
      }
    },
    []
  );

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      applyTheme(next);
      void save({ theme: next });
    },
    [save]
  );

  const setLanguage = useCallback(
    (next: AppLanguage) => {
      setLanguageState(next);
      void save({ language: next });
    },
    [save]
  );

  const value = useMemo(
    () => ({ theme, language, setTheme, setLanguage }),
    [theme, language, setTheme, setLanguage]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function useAppPreferences(): Preferences {
  const preferences = useContext(PreferencesContext);
  if (!preferences) {
    throw new Error(
      'useAppPreferences must be used inside AppPreferencesProvider'
    );
  }
  return preferences;
}
