import { NextResponse } from 'next/server';
/**
 * 1. Purpose: Extends target deadline date for an active goal up to 12 months.
 * 2. Spec Ref: UI Design Guide Category E Sheet 55 (Extend deadline).
 * 3. Called By: Roadmap GoalMenu ExtendDeadlineSheet.
 * 4. Calls: roadmap-service.ts extendDeadline.
 */

import { createClient } from '@/lib/db/server';
import { extendDeadline } from '@/lib/services/roadmap-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: goalId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const newDeadline = body.newDeadline as string;

    if (!newDeadline) {
      return NextResponse.json({ error: 'newDeadline is required' }, { status: 400 });
    }

    const result = await extendDeadline(user.id, goalId, newDeadline);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to extend deadline';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
