import { NextResponse } from 'next/server';
/**
 * 1. Purpose: Fetches the Roadmap Journey Map data (Screen 50 and State 51) for the active goal.
 * 2. Spec Ref: UI Design Guide Category E Screens 50-60 and State 51.
 * 3. Called By: Roadmap clients and external integrations.
 * 4. Calls: roadmap-service.ts getRoadmapData.
 */

import { createClient } from '@/lib/db/server';
import { getRoadmapData } from '@/lib/services/roadmap-service';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const goalId = searchParams.get('goalId') || undefined;

  try {
    const data = await getRoadmapData(user.id, goalId);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch roadmap';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
