/**
 * 1. Purpose: API endpoint returning live admin-configured onboarding context upload limits.
 * 2. Spec Ref: Database Schema v2.5 Section 5 Table 18 & Screen 10b limits display.
 * 3. Called By: Onboarding context file upload UI component.
 * 4. Calls: Admin Supabase client, system_settings table.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/admin';

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: settings } = await admin
      .from('system_settings')
      .select('onboarding_context_max_files, onboarding_context_max_file_size_bytes')
      .eq('id', 1)
      .single();

    const maxFiles = Number(settings?.onboarding_context_max_files) || 1;
    const maxFileSizeBytes = Number(settings?.onboarding_context_max_file_size_bytes) || 5242880;

    return NextResponse.json({
      maxFiles,
      maxFileSizeBytes,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch upload limits';
    return NextResponse.json(
      { error: 'FETCH_LIMITS_FAILED', details: msg, maxFiles: 1, maxFileSizeBytes: 5242880 },
      { status: 500 }
    );
  }
}
