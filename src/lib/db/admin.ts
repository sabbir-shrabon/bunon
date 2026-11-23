/**
 * 1. Purpose: Service-role Supabase client bypassing RLS for background cron and admin actions.
 * 2. Spec Ref: Database Schema v2.5 Section 1 (Master Security Decisions) & Folder Map.
 * 3. Called By: Cron jobs, payment webhook verifiers, and secure server-only admin APIs.
 * 4. Calls: @supabase/supabase-js createClient, src/types/database.ts.
 */

import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin environment variables');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
