import { NextResponse } from 'next/server';
/**
 * 1. Purpose: Updates a proof post caption or visibility, enforcing the last-proof safety guard.
 * 2. Spec Ref: UI Design Guide Category F Screen 65 (Edit proof).
 * 3. Called By: EditProofModal.
 * 4. Calls: timeline-service.ts updateTimelineProof.
 */

import { createClient } from '@/lib/db/server';
import { guardApiRoute } from '@/lib/services/access-guard.service';
import { updateTimelineProof } from '@/lib/services/timeline-service';
import type { EvidenceVisibility } from '@/types/domain';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: evidenceId } = await params;
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
    const caption = body.caption as string | undefined;
    const visibility = body.visibility as EvidenceVisibility | undefined;

    const result = await updateTimelineProof(user.id, evidenceId, { caption, visibility });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update proof';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
