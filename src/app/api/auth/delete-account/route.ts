/**
 * 1. Purpose: Permanently deletes the user account, storage proofs, and cascades all records.
 * 2. Spec Ref: Screen 92 Delete my account Sheet and Frictionless Auth account purge.
 * 3. Called By: Settings Screen 92 DeleteAccountSheet.
 * 4. Calls: Supabase admin storage purge, admin auth deleteUser, and session signOut.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/admin';
import { createClient } from '@/lib/db/server';

export async function POST() {
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();

    // 1. Fetch and delete all evidence files in bunon-proofs storage
    const { data: evidenceRows } = await admin
      .from('evidence')
      .select('storage_path')
      .eq('user_id', user.id);

    if (evidenceRows && evidenceRows.length > 0) {
      const storagePaths = evidenceRows
        .map((r) =>
          r.storage_path
            ? r.storage_path.replace(/^\/+/, '').replace(/^bunon-proofs\//, '')
            : null
        )
        .filter((p): p is string => Boolean(p));

      if (storagePaths.length > 0) {
        await admin.storage.from('bunon-proofs').remove(storagePaths);
      }
    }

    // 2. Remove avatar if stored in bunon-proofs
    const { data: userProfile } = await admin
      .from('users')
      .select('avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (
      userProfile?.avatar_url &&
      userProfile.avatar_url.includes('bunon-proofs/')
    ) {
      const avatarPath = userProfile.avatar_url
        .replace(/^\/+/, '')
        .replace(/^bunon-proofs\//, '');
      await admin.storage.from('bunon-proofs').remove([avatarPath]);
    }

    // 3. Delete the auth user (cascades to public.users, goals, milestones, tasks, notes, etc.)
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      throw error;
    }

    await sessionClient.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'Could not remove this account' },
      { status: 500 }
    );
  }
}
