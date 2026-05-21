import { NextResponse, type NextRequest } from "next/server";
import { ensureUserProfile } from "@/lib/auth/profile";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const admin = getSupabaseAdminClient();

  if (!supabase || !admin) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { error: profileError } = await ensureUserProfile(user);
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const icalUrl = typeof body?.icalUrl === "string" ? body.icalUrl.trim() : "";
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";

  if (!isValidAppleCalendarUrl(icalUrl)) {
    return NextResponse.json(
      { error: "Use an Apple Calendar webcal:// or https:// iCloud calendar URL." },
      { status: 400 }
    );
  }

  const normalizedUrl = normalizeCalendarUrl(icalUrl);
  const { data: existing, error: existingError } = await admin
    .from("user_integrations")
    .select("id")
    .eq("user_id", user.id)
    .eq("provider", "apple_calendar")
    .eq("access_mode", "public_ical")
    .eq("public_config->>ical_url", normalizedUrl)
    .maybeSingle<{ id: string }>();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const payload = {
      user_id: user.id,
      provider: "apple_calendar",
      display_name: displayName || "Apple Calendar",
      status: "connected",
      access_mode: "public_ical",
      public_config: {
        ical_url: normalizedUrl,
        original_url_scheme: icalUrl.startsWith("webcal://") ? "webcal" : "https"
      },
      error_message: null,
      updated_at: new Date().toISOString()
    };

  const query = existing
    ? admin.from("user_integrations").update(payload).eq("id", existing.id)
    : admin.from("user_integrations").insert(payload).select("id").single();

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: existing?.id ?? data?.id });
}

function isValidAppleCalendarUrl(value: string) {
  if (!value) return false;
  if (!value.startsWith("webcal://") && !value.startsWith("https://")) return false;
  try {
    const url = new URL(normalizeCalendarUrl(value));
    return url.hostname.endsWith("icloud.com") || url.hostname.endsWith("icloud-content.com");
  } catch {
    return false;
  }
}

function normalizeCalendarUrl(value: string) {
  return value.replace(/^webcal:\/\//, "https://");
}
