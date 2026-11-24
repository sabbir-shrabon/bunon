/**
 * 1. Purpose: API route handler for logging +1 today daily quota for DAILY_CORE or WEEKLY_QUOTA tasks.
 * 2. Spec Ref: Database Schema v2.5 Section 5.2 Table 6 & Stitch Screen 22 quota mode.
 * 3. Called By: Today view weekly tasks quota buttons.
 * 4. Calls: createClient and task-service logDailyQuota.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';
import { guardApiRoute } from '@/lib/services/access-guard.service';
import { logDailyQuota } from '@/lib/services/task-service';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const guard = await guardApiRoute(user.id);
  if (!guard.ok) return guard.response;

  const { id: taskId } = await params;
  const result = await logDailyQuota(user.id, taskId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
