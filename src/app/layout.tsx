/**
 * 1. Purpose: Provides the root document, Google fonts, and persisted app preferences.
 * 2. Spec Ref: Stitch DESIGN.md Typography and UI Design Guide Section 1.
 * 3. Called By: Next.js App Router for all application routes.
 * 4. Calls: globals.css and AppPreferencesProvider.
 */

import type { Metadata } from 'next';
import { Inter, Noto_Sans_Bengali } from 'next/font/google';
import { AppPreferencesProvider } from '@/lib/i18n/app-preferences';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const bengali = Noto_Sans_Bengali({ subsets: ['bengali'], variable: '--font-bengali' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://bunon.app'),
  title: 'Bunon — Goal Execution & Comeback Companion',
  description: 'Built for people who start strong and then fade.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${bengali.variable}`}>
        <AppPreferencesProvider>{children}</AppPreferencesProvider>
      </body>
    </html>
  );
}
