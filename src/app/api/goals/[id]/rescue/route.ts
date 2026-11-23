import { NextResponse } from 'next/server';
/**
 * 1. Purpose: Handles 'Feeling like stopping?' options: SHRINK_TO_MVG, PIVOT_STRATEGY, or clean ARCHIVE.
 * 2. Spec Ref: UI Design Guide Category E Sheet 57 (Feeling like stopping?) and Pipeline 6.
 * 3. Called By: Roadmap RescueSheet 57.
 * 4. Calls: roadmap-service.ts replanGoal and abandonGoal.
 */

import { createClient } from '@/lib/db/server';
import { replanGoal, abandonGoal } from '@/lib/services/roadmap-service';

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
    const action = body.action as 'SHRINK_TO_MVG' | 'PIVOT_STRATEGY' | 'ARCHIVE';
    const reason = body.reason as string | undefined;

    if (action === 'ARCHIVE') {
      const result = await abandonGoal(user.id, goalId, reason);
      return NextResponse.json(result);
    }

    if (action === 'SHRINK_TO_MVG' || action === 'PIVOT_STRATEGY') {
      const preview = await replanGoal(user.id, goalId, action);
      return NextResponse.json(preview);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Rescue action failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
