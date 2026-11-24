import { NextResponse } from 'next/server';
/**
 * 1. Purpose: Fetches user notices from the last 30 days and marks them as read.
 * 2. Spec Ref: UI Design Guide Category G Screen 78 (Bell: notices list).
 * 3. Called By: /notifications page and TopBar bell unread indicator.
 * 4. Calls: Admin Supabase client.
 */

import { createClient } from '@/lib/db/server';
import { createAdminClient } from '@/lib/db/admin';
import { guardApiRoute } from '@/lib/services/access-guard.service';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ notifications: [] });
  }

  const admin = createAdminClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: notices } = await admin
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  return NextResponse.json({ notifications: notices || [] });
}

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

  const admin = createAdminClient();
  const body = await request.json().catch(() => ({}));
  const noticeId = body.id as string | undefined;

  let query = admin.from('notifications').update({ is_read: true }).eq('user_id', user.id);
  if (noticeId) {
    query = query.eq('id', noticeId);
  }

  await query;
  return NextResponse.json({ success: true });
}
