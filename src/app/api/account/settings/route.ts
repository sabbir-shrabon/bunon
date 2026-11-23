/**
 * 1. Purpose: Updates user notification preferences, reminder slot, and client settings.
 * 2. Spec Ref: Screen 89 Reminder time & notifications and Settings Screen 88.
 * 3. Called By: Settings Screen 89 NotificationsSection.
 * 4. Calls: Server Supabase client to update public.users row.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/db/server';

const settingsSchema = z.object({
  reminder_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Invalid time format')
    .optional(),
  push_enabled: z.boolean().optional(),
  email_reminders_enabled: z.boolean().optional(),
  theme: z.enum(['LIGHT', 'DARK']).optional(),
  language: z.enum(['EN', 'BN']).optional(),
});

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as unknown;
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid settings payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.reminder_time !== undefined) {
      // Ensure HH:MM:00 format
      const parts = parsed.data.reminder_time.split(':');
      updates.reminder_time = `${parts[0]}:${parts[1]}:00`;
    }
    if (parsed.data.push_enabled !== undefined) {
      updates.push_enabled = parsed.data.push_enabled;
    }
    if (parsed.data.email_reminders_enabled !== undefined) {
      updates.email_reminders_enabled = parsed.data.email_reminders_enabled;
    }
    if (parsed.data.theme !== undefined) {
      updates.theme = parsed.data.theme;
    }
    if (parsed.data.language !== undefined) {
      updates.language = parsed.data.language;
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, settings: updates });
  } catch {
    return NextResponse.json(
      { error: 'Could not update settings' },
      { status: 500 }
    );
  }
}
