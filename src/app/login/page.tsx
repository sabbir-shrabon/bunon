/**
 * 1. Purpose: Displays Bunon's direct email/password sign-in and account creation screen.
 * 2. Spec Ref: Stitch sign_in_create_account Screens 1–4.
 * 3. Called By: Next.js App Router for '/login'.
 * 4. Calls: AuthCard.
 */

import { Suspense } from 'react';
import { AuthCard } from '@/components/auth/auth-card';

export default function LoginPage() {
  return (
    <Suspense>
      <AuthCard />
    </Suspense>
  );
}
