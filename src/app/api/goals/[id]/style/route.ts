import { NextResponse } from 'next/server';
/**
 * 1. Purpose: Switches plan_style between FLEXIBLE_WEEK and DAILY_ADAPTIVE in 0ms at $0 cost.
 * 2. Spec Ref: UI Design Guide Category E Sheet 52 Goal Menu and Section 1 Rules.
 * 3. Called By: Roadmap GoalMenu style switcher.
 * 4. Calls: roadmap-service.ts switchPlanStyle.
 */

import { createClient } from '@/lib/db/server';
import { guardApiRoute } from '@/lib/services/access-guard.service';
import { switchPlanStyle } from '@/lib/services/roadmap-service';
import type { PlanStyle } from '@/types/domain';

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

  const guard = await guardApiRoute(user.id);
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();
    const planStyle = body.planStyle as PlanStyle;

    if (planStyle !== 'FLEXIBLE_WEEK' && planStyle !== 'DAILY_ADAPTIVE') {
      return NextResponse.json({ error: 'Invalid planStyle' }, { status: 400 });
    }

    const result = await switchPlanStyle(user.id, goalId, planStyle);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to switch style';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
