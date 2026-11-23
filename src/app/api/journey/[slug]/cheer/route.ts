import { NextResponse } from 'next/server';
/**
 * 1. Purpose: Increments public cheer clap count for an earned Journey Card.
 * 2. Spec Ref: UI Design Guide Category H Screen 102 (Public Journey Card).
 * 3. Called By: Public Journey Card cheer button.
 * 4. Calls: journey-service.ts cheerJourneyCard.
 */

import { cheerJourneyCard } from '@/lib/services/journey-service';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const result = await cheerJourneyCard(slug);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cheer failed';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
