import { NextResponse, type NextRequest } from "next/server";
import { ensureUserProfile } from "@/lib/auth/profile";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PUT(request: NextRequest) {
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
  const habitId = typeof body?.habitId === "string" ? body.habitId : "";
  const date = typeof body?.date === "string" ? body.date : "";
  const completed = body?.completed === true;

  if (!habitId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Habit id and date are required." }, { status: 400 });
  }

  const { data: habit, error: habitError } = await admin
    .from("habit_definitions")
    .select("id")
    .eq("id", habitId)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (habitError) {
    return NextResponse.json({ error: habitError.message }, { status: 500 });
  }

  if (!habit) {
    return NextResponse.json({ error: "Habit not found." }, { status: 404 });
  }

  const { error } = await admin.from("habit_entries").upsert(
    {
      user_id: user.id,
      habit_id: habitId,
      log_date: date,
      completed,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id,habit_id,log_date" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ habitId, date, completed });
}
