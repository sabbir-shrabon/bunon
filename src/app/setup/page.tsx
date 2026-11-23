/**
 * 1. Purpose: Hosts the one-time profile and 18+ eligibility setup card.
 * 2. Spec Ref: Screen 7 18+ Birth-Year Gate.
 * 3. Called By: Next.js App Router for '/setup'.
 * 4. Calls: SetupCard.
 */

import { Suspense } from 'react';
import { SetupCard } from '@/components/auth/setup-card';

export default function SetupPage() {
  return (
    <Suspense>
      <SetupCard />
    </Suspense>
  );
}
