import { NextResponse } from 'next/server';
/**
 * 1. Purpose: Runs Pipeline 6 to preview or apply a roadmap re-plan for unfinished milestones.
 * 2. Spec Ref: UI Design Guide Category E Screens 52, 55, 56 and Pipeline 6.
 * 3. Called By: Roadmap GoalMenu, ExtendDeadlineSheet, and ReplanPreview.
 * 4. Calls: roadmap-service.ts replanGoal and applyReplan.
 */

import { createClient } from '@/lib/db/server';
import { AIFirewallError } from '@/lib/ai/firewall';
import { formatAIFirewallHttpError, guardApiRoute } from '@/lib/services/access-guard.service';
import { replanGoal, applyReplan } from '@/lib/services/roadmap-service';

export const maxDuration = 60;

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
    const { action, replanReason, newDeadline, revisedMilestones } = body;

    if (action === 'APPLY') {
      if (!revisedMilestones?.length) {
        return NextResponse.json({ error: 'revisedMilestones required' }, { status: 400 });
      }
      const res = await applyReplan(user.id, goalId, revisedMilestones, newDeadline);
      return NextResponse.json(res);
    }

    // Default: Preview re-plan via Pipeline 6
    const preview = await replanGoal(user.id, goalId, replanReason || 'MANUAL_RESTRUCTURE', newDeadline);
    return NextResponse.json(preview);
  } catch (err) {
    if (err instanceof AIFirewallError) {
      const formatted = formatAIFirewallHttpError(err.reason, err.retryAfterSeconds);
      return NextResponse.json(formatted.body, { status: formatted.status });
    }
    const message = err instanceof Error ? err.message : 'Re-plan failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
