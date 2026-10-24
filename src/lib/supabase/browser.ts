"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/**
 * Browser Supabase client for sign-in. Returns null until the Supabase URL and
 * anon key are set, so the app can say Google sign-in isn't set up yet.
 */
export function browserSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key, { auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true } }) : null;
  return client;
}
