import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
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

  const body = await request.json().catch(() => null);
  const icalUrl = typeof body?.icalUrl === "string" ? body.icalUrl.trim() : "";
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "Apple Calendar";

  if (!isValidAppleCalendarUrl(icalUrl)) {
    return NextResponse.json(
      { error: "Use an Apple Calendar webcal:// or https:// iCloud calendar URL." },
      { status: 400 }
    );
  }

  const normalizedUrl = normalizeCalendarUrl(icalUrl);
  const { error } = await admin.from("user_integrations").upsert(
    {
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
    },
    { onConflict: "user_id,provider,access_mode" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
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
