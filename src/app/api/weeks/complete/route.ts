import { NextResponse } from 'next/server';
/**
 * 1. Purpose: Completes a goal week, executing Pipeline 5 review, Pipeline 3 rollover, or Pipeline 7 completion.
 * 2. Spec Ref: UI Design Guide Category C Screen 37, Category H Screen 97, and Pipelines 5, 3, 7.
 * 3. Called By: Today AllDoneView and WeeklySummary triggers.
 * 4. Calls: week-service.ts advanceWeek.
 */

import { createClient } from '@/lib/db/server';
import { AIFirewallError } from '@/lib/ai/firewall';
import { formatAIFirewallHttpError, guardApiRoute } from '@/lib/services/access-guard.service';
import { advanceWeek } from '@/lib/services/week-service';

export const maxDuration = 60;

export async function POST(request: Request) {
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
    const body = await request.json();
    const goalId = body.goalId;

    if (!goalId) {
      return NextResponse.json({ error: 'goalId is required' }, { status: 400 });
    }

    const result = await advanceWeek(user.id, goalId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AIFirewallError) {
      const formatted = formatAIFirewallHttpError(err.reason, err.retryAfterSeconds);
      return NextResponse.json(formatted.body, { status: formatted.status });
    }
    const message = err instanceof Error ? err.message : 'Failed to advance week';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
