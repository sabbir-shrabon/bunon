/**
 * 1. Purpose: Updates user profile details (name, bio, location, role, avatar).
 * 2. Spec Ref: Screen 80 Edit profile and Screen 81 Avatar picture sheet.
 * 3. Called By: EditProfileView client component.
 * 4. Calls: Server Supabase client and public.users row update.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/db/server';
import { guardApiRoute } from '@/lib/services/access-guard.service';

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
  bio: z.string().trim().max(80).nullable().optional(),
  city_country: z.string().trim().max(80).nullable().optional(),
  work_study_role: z.string().trim().max(80).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
});

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const guard = await guardApiRoute(user.id);
  if (!guard.ok) return guard.response;

  try {
    const body = (await request.json()) as unknown;
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid profile payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const updates = {
      name: parsed.data.name,
      bio: parsed.data.bio ?? null,
      city_country: parsed.data.city_country ?? null,
      work_study_role: parsed.data.work_study_role ?? null,
      ...(parsed.data.avatar_url !== undefined
        ? { avatar_url: parsed.data.avatar_url }
        : {}),
    };

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      throw error;
    }

    // Also sync name to auth metadata for fast header display
    await supabase.auth.updateUser({
      data: { name: parsed.data.name },
    });

    return NextResponse.json({ ok: true, profile: updates });
  } catch {
    return NextResponse.json(
      { error: 'Could not update profile' },
      { status: 500 }
    );
  }
}
