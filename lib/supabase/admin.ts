import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublishableKey, getSupabaseSecretKey, getSupabaseUrl } from "@/lib/env";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdminClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseSecretKey() ?? getSupabasePublishableKey();

  if (!url || !key) {
    return null;
  }

  cachedClient ??= createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return cachedClient;
}
