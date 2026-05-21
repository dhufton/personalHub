import type { User } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function ensureUserProfile(user: User) {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return { error: null };
  }

  const displayName =
    readStringMetadata(user.user_metadata, "display_name") ??
    readStringMetadata(user.user_metadata, "name") ??
    user.email?.split("@")[0] ??
    "User";

  const { error } = await admin.from("profiles").upsert(
    {
      id: user.id,
      display_name: displayName,
      email: user.email,
      role: "admin",
      timezone: "Europe/London",
      home_currency: "GBP",
      week_starts_on: "Monday",
      avatar_url: readStringMetadata(user.user_metadata, "avatar_url"),
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  return { error };
}

function readStringMetadata(metadata: User["user_metadata"], key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
