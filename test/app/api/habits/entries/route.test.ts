import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ensureUserProfile } from "@/lib/auth/profile";
import { PUT } from "@/app/api/habits/entries/route";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

vi.mock("@/lib/auth/profile", () => ({ ensureUserProfile: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn() }));

const adminFactory = vi.mocked(getSupabaseAdminClient);
const serverFactory = vi.mocked(createServerSupabaseClient);

function request(body: unknown) {
  return new NextRequest("https://personal.test/api/habits/entries", {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

function adminForHabit(data: unknown, upsertError: unknown = null, habitError: unknown = null) {
  const upsert = vi.fn().mockResolvedValue({ error: upsertError });
  return {
    upsert,
    from: vi.fn((table: string) => {
      if (table === "habit_entries") return { upsert };
      const query: Record<string, unknown> = {};
      query.select = vi.fn(() => query);
      query.eq = vi.fn(() => query);
      query.maybeSingle = vi.fn().mockResolvedValue({ data, error: habitError });
      return query;
    })
  };
}

beforeEach(() => {
  serverFactory.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) }
  } as never);
  vi.mocked(ensureUserProfile).mockResolvedValue({ error: null } as never);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("habit entry PUT", () => {
  it("requires an authenticated user", async () => {
    serverFactory.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } } as never);
    adminFactory.mockReturnValue(adminForHabit(null) as never);

    const response = await PUT(request({ habitId: "habit", date: "2026-05-24" }));

    expect(response.status).toBe(401);
  });

  it("requires configured services and successful profile provisioning", async () => {
    serverFactory.mockResolvedValue(null);
    adminFactory.mockReturnValue(null);
    expect((await PUT(request({ habitId: "habit", date: "2026-05-24" }))).status).toBe(503);

    serverFactory.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) }
    } as never);
    adminFactory.mockReturnValue(adminForHabit(null) as never);
    vi.mocked(ensureUserProfile).mockResolvedValue({ error: { message: "profile failed" } } as never);
    expect((await PUT(request({ habitId: "habit", date: "2026-05-24" }))).status).toBe(500);
  });

  it("validates the habit ID and ISO date", async () => {
    adminFactory.mockReturnValue(adminForHabit(null) as never);

    const response = await PUT(request({ habitId: "", date: "tomorrow" }));

    expect(response.status).toBe(400);
  });

  it("rejects entries for habits the user does not own", async () => {
    adminFactory.mockReturnValue(adminForHabit(null) as never);

    const response = await PUT(request({ habitId: "other", date: "2026-05-24", completed: true }));

    expect(response.status).toBe(404);
  });

  it("surfaces habit lookup and entry write failures", async () => {
    adminFactory.mockReturnValue(adminForHabit(null, null, { message: "lookup failed" }) as never);
    expect((await PUT(request({ habitId: "habit", date: "2026-05-24" }))).status).toBe(500);

    adminFactory.mockReturnValue(adminForHabit({ id: "habit" }, { message: "write failed" }) as never);
    expect((await PUT(request({ habitId: "habit", date: "2026-05-24" }))).status).toBe(500);
  });

  it("upserts a completed habit entry", async () => {
    const admin = adminForHabit({ id: "habit" });
    adminFactory.mockReturnValue(admin as never);

    const response = await PUT(request({ habitId: "habit", date: "2026-05-24", completed: true }));

    expect(response.status).toBe(200);
    expect(admin.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u1", habit_id: "habit", log_date: "2026-05-24", completed: true }),
      { onConflict: "user_id,habit_id,log_date" }
    );
  });
});
