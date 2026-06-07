import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const looksLikeSupabaseKey = (key?: string) =>
  Boolean(key && (key.startsWith("eyJ") || key.startsWith("sb_publishable_")) && key.length > 40);

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("TU-PROYECTO") &&
    !supabaseAnonKey.includes("TU_ANON_KEY") &&
    looksLikeSupabaseKey(supabaseAnonKey),
);

if (!isSupabaseConfigured) {
  // The app still renders an actionable setup screen when env vars are absent.
  console.warn("Supabase environment variables are missing.");
}

export const supabase = createClient(supabaseUrl ?? "https://example.supabase.co", supabaseAnonKey ?? "missing-key", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
