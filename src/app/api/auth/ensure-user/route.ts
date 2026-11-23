/**
 * 1. Purpose: Ensures a valid session always has a corresponding public.users row.
 * 2. Spec Ref: Frictionless Auth Automatic Profile Upsert requirement.
 * 3. Called By: Login, signup, setup, and preference-aware client flows.
 * 4. Calls: Server Supabase auth client and ensureUserRow.
 */

import { NextResponse } from 'next/server';
import { ensureUserRow } from '@/lib/auth/ensure-user';
import { createClient } from '@/lib/db/server';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profile = await ensureUserRow(user);
    return NextResponse.json({ user: profile });
  } catch {
    return NextResponse.json(
      { error: 'Could not prepare your profile' },
      { status: 500 }
    );
  }
}
