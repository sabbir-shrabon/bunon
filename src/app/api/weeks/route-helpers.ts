/**
 * 1. Purpose: Shared request parsing and sanitized 503/firewall error handling for /api/weeks/* handlers.
 * 2. Spec Ref: UI Design Guide Category C Screen 37 & Vercel 60s timeout guard.
 * 3. Called By: /api/weeks/review, /api/weeks/plan-next, and /api/weeks/complete.
 * 4. Calls: createClient, guardApiRoute, AIFirewallError, isTransientAIError.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';
import { AIFirewallError } from '@/lib/ai/firewall';
import { isTransientAIError } from '@/lib/ai/assembler-helpers';
import { formatAIFirewallHttpError, guardApiRoute } from '@/lib/services/access-guard.service';

export async function authorizeWeekMutation(request: Request): Promise<
  | { ok: true; userId: string; goalId: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const guard = await guardApiRoute(user.id);
  if (!guard.ok) return { ok: false, response: guard.response };

  let body: { goalId?: unknown };
  try {
    body = (await request.json()) as { goalId?: unknown };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'INVALID_JSON', message: 'Invalid JSON payload' }, { status: 400 }),
    };
  }

  const goalId = typeof body.goalId === 'string' ? body.goalId.trim() : '';
  if (!goalId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'goalId is required' }, { status: 400 }),
    };
  }

  return { ok: true, userId: user.id, goalId };
}

export function handleWeekRouteError(err: unknown, calmMessage: string): NextResponse {
  console.error('[api/weeks error]', err);

  if (err instanceof AIFirewallError) {
    const formatted = formatAIFirewallHttpError(err.reason, err.retryAfterSeconds);
    return NextResponse.json(formatted.body, { status: formatted.status });
  }

  if (isTransientAIError(err)) {
    return NextResponse.json(
      { error: 'AI_UNAVAILABLE', message: calmMessage },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: 'WEEK_GENERATION_FAILED', message: calmMessage },
    { status: 503 }
  );
}
