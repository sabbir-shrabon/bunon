/**
 * 1. Purpose: API endpoint returning live admin-configured onboarding context upload limits.
 * 2. Spec Ref: Database Schema v2.5 Section 5 Table 18 & Screen 10b limits display.
 * 3. Called By: Onboarding context file upload UI component.
 * 4. Calls: connection, getSystemSettings.
 */

import { NextResponse } from 'next/server';
import { connection } from 'next/server';
import { getSystemSettings } from '@/lib/services/system-settings.service';

export async function GET() {
  await connection();

  try {
    const settings = await getSystemSettings({ fresh: true });
    return NextResponse.json(
      {
        maxFiles: settings.onboarding_context_max_files,
        maxFileSizeBytes: settings.onboarding_context_max_file_size_bytes,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch upload limits';
    return NextResponse.json(
      { error: 'FETCH_LIMITS_FAILED', details: msg, maxFiles: 1, maxFileSizeBytes: 5242880 },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }
}
