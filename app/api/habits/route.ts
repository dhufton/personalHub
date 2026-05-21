import { NextResponse, type NextRequest } from "next/server";
import { ensureUserProfile } from "@/lib/auth/profile";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type HabitRow = {
  id: string;
  name: string;
  parent_habit_id: string | null;
  target_per_week: number | null;
  sort_order: number | null;
  active: boolean | null;
};

type HabitPayload = {
  id: string;
  name: string;
  parentHabitId?: string;
  targetPerWeek: number;
  sortOrder: number;
  active: boolean;
};

export async function POST(request: NextRequest) {
  const context = await getAuthenticatedHabitContext();
  if (context instanceof NextResponse) return context;

  const body = await request.json().catch(() => null);
  const name = normalizeName(body?.name);
  const parentHabitId = typeof body?.parentHabitId === "string" && body.parentHabitId ? body.parentHabitId : null;
  const targetPerWeek = normalizeTargetPerWeek(body?.targetPerWeek);
  const subHabits: string[] = Array.isArray(body?.subHabits) ? body.subHabits.map(normalizeName).filter(Boolean) : [];

  if (!name) {
    return NextResponse.json({ error: "Habit name is required." }, { status: 400 });
  }

  if (parentHabitId) {
    const { data: parent, error: parentError } = await context.admin
      .from("habit_definitions")
      .select("id")
      .eq("id", parentHabitId)
      .eq("user_id", context.userId)
      .is("parent_habit_id", null)
      .maybeSingle<{ id: string }>();

    if (parentError) {
      return NextResponse.json({ error: parentError.message }, { status: 500 });
    }

    if (!parent) {
      return NextResponse.json({ error: "Parent habit not found." }, { status: 404 });
    }
  }

  const sortOrder = await getNextSortOrder(context.userId, parentHabitId);
  const { data: habit, error } = await context.admin
    .from("habit_definitions")
    .insert({
      user_id: context.userId,
      parent_habit_id: parentHabitId,
      name,
      target_per_week: targetPerWeek,
      sort_order: sortOrder,
      active: true,
      updated_at: new Date().toISOString()
    })
    .select("id,name,parent_habit_id,target_per_week,sort_order,active")
    .single<HabitRow>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const createdSubHabits: HabitPayload[] = [];
  if (!parentHabitId && subHabits.length) {
    const rows = subHabits.map((subHabitName, index) => ({
      user_id: context.userId,
      parent_habit_id: habit.id,
      name: subHabitName,
      target_per_week: targetPerWeek,
      sort_order: index + 1,
      active: true,
      updated_at: new Date().toISOString()
    }));

    const { data: children, error: childrenError } = await context.admin
      .from("habit_definitions")
      .insert(rows)
      .select("id,name,parent_habit_id,target_per_week,sort_order,active")
      .returns<HabitRow[]>();

    if (childrenError) {
      return NextResponse.json({ error: childrenError.message }, { status: 500 });
    }

    createdSubHabits.push(...(children ?? []).map(mapHabit));
  }

  return NextResponse.json({ habit: mapHabit(habit), subHabits: createdSubHabits });
}

export async function DELETE(request: NextRequest) {
  const context = await getAuthenticatedHabitContext();
  if (context instanceof NextResponse) return context;

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";

  if (!id) {
    return NextResponse.json({ error: "Habit id is required." }, { status: 400 });
  }

  const { error } = await context.admin.from("habit_definitions").delete().eq("id", id).eq("user_id", context.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function getAuthenticatedHabitContext() {
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

  return { admin, userId: user.id };
}

async function getNextSortOrder(userId: string, parentHabitId: string | null) {
  let query = getSupabaseAdminClient()
    ?.from("habit_definitions")
    .select("sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: false })
    .limit(1);

  query = parentHabitId ? query?.eq("parent_habit_id", parentHabitId) : query?.is("parent_habit_id", null);
  const { data } = (await query?.maybeSingle<{ sort_order: number | null }>()) ?? { data: null };

  return (data?.sort_order ?? 0) + 1;
}

function normalizeName(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 80) : "";
}

function normalizeTargetPerWeek(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 7;
  return Math.max(1, Math.min(7, Math.round(value)));
}

function mapHabit(row: HabitRow): HabitPayload {
  return {
    id: row.id,
    name: row.name,
    parentHabitId: row.parent_habit_id ?? undefined,
    targetPerWeek: row.target_per_week ?? 7,
    sortOrder: row.sort_order ?? 0,
    active: row.active ?? true
  };
}
