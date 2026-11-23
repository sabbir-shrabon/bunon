import { NextResponse, type NextRequest } from 'next/server';
/**
 * 1. Purpose: Fetches the Roadmap Journey Map data (Screen 50 and State 51) for a specific goal ID.
 * 2. Spec Ref: UI Design Guide Category E Screens 50-60 and State 51.
 * 3. Called By: Roadmap goal switchers and goal detail views.
 * 4. Calls: roadmap-service.ts getRoadmapData.
 */

import { createClient } from '@/lib/db/server';
import { getRoadmapData } from '@/lib/services/roadmap-service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: goalId } = await params;

  try {
    const data = await getRoadmapData(user.id, goalId);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch goal roadmap';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
