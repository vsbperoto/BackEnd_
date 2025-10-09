// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

type SupabaseEnvKey = "SUPABASE_URL" | "SUPABASE_ANON_KEY";

export const getSupabaseEnvValue = (
  key: SupabaseEnvKey,
): string | undefined => {
  const env = import.meta.env as Record<string, string | undefined>;
  const legacyPrefix = "VITE_";
  return env[key] ?? env[`${legacyPrefix}${key}`];
};

const supabaseUrl = getSupabaseEnvValue("SUPABASE_URL");
const supabaseAnonKey = getSupabaseEnvValue("SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Single client for public operations
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
