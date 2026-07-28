"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client — safe to use in client components.
 * Relies on the anon key + RLS policies in supabase/schema.sql.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
