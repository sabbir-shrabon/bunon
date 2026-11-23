/**
 * 1. Purpose: Upserts the authenticated user's required public.users profile with safe defaults.
 * 2. Spec Ref: Frictionless Auth Automatic Profile Upsert requirement.
 * 3. Called By: /api/auth/ensure-user.
 * 4. Calls: Server Supabase client and authenticated Supabase user metadata.
 */

import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/db/server';

function defaultName(user: User): string {
  const candidate =
    user.user_metadata.full_name ||
    user.user_metadata.name ||
    user.email?.split('@')[0];

  return typeof candidate === 'string' && candidate.trim()
    ? candidate.trim().slice(0, 80)
    : 'Bunon member';
}

export async function ensureUserRow(user: User) {
  if (!user.email) {
    throw new Error('Authenticated users require an email address');
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        id: user.id,
        email: user.email,
        name: defaultName(user),
      },
      { onConflict: 'id' }
    )
    .select('id, birth_year, language, theme')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
