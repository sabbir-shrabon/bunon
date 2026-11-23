/**
 * 1. Purpose: Directs root URL '/' visitors directly to '/today' workspace without auth gates.
 * 2. Spec Ref: Stitch Screen 22a and Rule 11 Frictionless Auth Direct Guest Entry.
 * 3. Called By: Next.js App Router for '/'.
 * 4. Calls: redirect to /today.
 */

import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/today');
}
