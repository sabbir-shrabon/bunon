/**
 * 1. Purpose: Server Supabase client for Server Components, Route Handlers, and Server Actions.
 * 2. Spec Ref: Database Schema v2.5 Section 1 (Master Security Decisions) & Folder Map.
 * 3. Called By: Server Components, API route handlers, and server actions.
 * 4. Calls: @supabase/ssr createServerClient, next/headers cookies, src/types/database.ts.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing Supabase public environment variables');
  }

  return createServerClient<Database>(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignores setAll calls from Server Components when middleware handles session refresh
        }
      },
    },
  });
}
