/**
 * 1. Purpose: Browser Supabase client utilizing anon key and enforced Row-Level Security.
 * 2. Spec Ref: Database Schema v2.5 Section 1 (Master Security Decisions) & Folder Map.
 * 3. Called By: Client components, custom browser hooks, and UI interaction handlers.
 * 4. Calls: @supabase/ssr createBrowserClient, src/types/database.ts.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing Supabase public environment variables');
  }

  return createBrowserClient<Database>(supabaseUrl, anonKey);
}
