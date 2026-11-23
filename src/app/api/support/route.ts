/**
 * 1. Purpose: Saves user feedback and support tickets to the admin support queue.
 * 2. Spec Ref: Screen 76 Feedback form and Screen 76a Help & support ticket submission.
 * 3. Called By: FeedbackView and SupportView components.
 * 4. Calls: Server Supabase client and public.support_tickets row insert.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/admin';
import { createClient } from '@/lib/db/server';

const ticketSchema = z.object({
  kind: z.enum(['FEEDBACK', 'SUPPORT']),
  category_tag: z.string().trim().min(1).max(50),
  message: z.string().trim().min(3).max(1000),
  screen_path: z.string().optional(),
  app_version: z.string().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Please sign in to send feedback or support messages' },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as unknown;
    const parsed = ticketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid ticket payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: ticket, error } = await admin
      .from('support_tickets')
      .insert({
        user_id: user.id,
        kind: parsed.data.kind,
        category_tag: parsed.data.category_tag,
        message: parsed.data.message,
        screen_path: parsed.data.screen_path ?? null,
        app_version: parsed.data.app_version ?? '1.0.4',
        status: 'OPEN',
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, ticket_id: ticket.id });
  } catch {
    return NextResponse.json(
      { error: 'Could not submit your message' },
      { status: 500 }
    );
  }
}
