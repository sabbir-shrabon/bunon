/**
 * 1. Purpose: Clears the current Supabase session before returning to guest Today.
 * 2. Spec Ref: Milestone 2 Clean Log Out flow.
 * 3. Called By: Drawer sign-out control.
 * 4. Calls: Server Supabase auth client.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
