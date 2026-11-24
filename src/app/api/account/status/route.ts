/**
 * 1. Purpose: Returns live user status, Pro entitlement, and system maintenance/AI flags.
 * 2. Spec Ref: Live admin sync for users.pro_until, users.status, and system_settings.
 * 3. Called By: useAuthSession and client shell components.
 * 4. Calls: connection, createClient, getPageAccessState.
 */

import { NextResponse } from 'next/server';
import { connection } from 'next/server';
import { createClient } from '@/lib/db/server';
import { getPageAccessState } from '@/lib/services/access-guard.service';

export async function GET() {
  await connection();

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { settings, profile } = await getPageAccessState(user?.id ?? null, {
      allowSuspended: true,
      allowMaintenance: true,
    });

    return NextResponse.json(
      {
        authenticated: Boolean(user),
        status: profile?.status ?? null,
        proUntil: profile?.pro_until ?? null,
        isPro: profile?.isPro ?? false,
        maintenanceMode: settings.full_maintenance_mode,
        aiKillSwitch: settings.ai_kill_switch,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        authenticated: false,
        status: null,
        proUntil: null,
        isPro: false,
        maintenanceMode: false,
        aiKillSwitch: false,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }
}
