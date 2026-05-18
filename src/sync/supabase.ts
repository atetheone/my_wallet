/**
 * Minimal cloud identity. One-time magic-link (email OTP) — no password, no
 * account UI. Sync is a no-op until env vars are set, so the app is fully
 * usable offline / unconfigured.
 *
 * Configure in `.env`:
 *   VITE_SUPABASE_URL=...
 *   VITE_SUPABASE_ANON_KEY=...
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const syncConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (!syncConfigured) throw new Error("Sync non configurée");
  if (!client) client = createClient(url as string, key as string);
  return client;
}

export async function signInWithEmail(email: string): Promise<void> {
  await supabase().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
}

export async function currentEmail(): Promise<string | null> {
  if (!syncConfigured) return null;
  const { data } = await supabase().auth.getUser();
  return data.user?.email ?? null;
}
