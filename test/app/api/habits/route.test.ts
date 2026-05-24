import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ensureUserProfile } from "@/lib/auth/profile";
import { DELETE, POST } from "@/app/api/habits/route";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

vi.mock("@/lib/auth/profile", () => ({ ensureUserProfile: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn() }));

const adminFactory = vi.mocked(getSupabaseAdminClient);
const serverFactory = vi.mocked(createServerSupabaseClient);

function jsonRequest(method: string, body: unknown) {
  return new NextRequest("https://personal.test/api/habits", {
    method,
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" }
  });
}

function chainResults(results: Array<{ data?: unknown; error?: unknown }>) {
  const inserted: unknown[] = [];
  const deleted: unknown[] = [];
  const admin = {
    inserted,
    deleted,
    from: vi.fn(() => {
      const query: Record<string, unknown> = {};
      for (const name of ["select", "eq", "is", "order", "limit"]) {
        query[name] = vi.fn(() => query);
      }
      query.insert = vi.fn((value) => {
        inserted.push(value);
        return query;
      });
      query.delete = vi.fn(() => {
        deleted.push(true);
        return query;
      });
      for (const terminal of ["maybeSingle", "single", "returns"]) {
        query[terminal] = vi.fn().mockImplementation(async () => results.shift() ?? { data: null, error: null });
      }
      query.then = (resolve: (value: unknown) => void, reject: (reason: unknown) => void) =>
        Promise.resolve(results.shift() ?? { data: null, error: null }).then(resolve, reject);
      return query;
    })
  };
  return admin;
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

describe("habit routes", () => {
  it("returns an unavailable response without configured Supabase clients", async () => {
    serverFactory.mockResolvedValue(null);
    adminFactory.mockReturnValue(null);

    const response = await POST(jsonRequest("POST", { name: "Read" }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "Supabase is not configured." });
  });

  it("rejects empty habit names after authentication", async () => {
    adminFactory.mockReturnValue(chainResults([]) as never);

    const response = await POST(jsonRequest("POST", { name: "  " }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Habit name is required." });
  });

  it("requires authentication and a successfully provisioned profile", async () => {
    adminFactory.mockReturnValue(chainResults([]) as never);
    serverFactory.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) }
    } as never);

    expect((await POST(jsonRequest("POST", { name: "Read" }))).status).toBe(401);

    serverFactory.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) }
    } as never);
    vi.mocked(ensureUserProfile).mockResolvedValue({ error: { message: "profile failed" } } as never);
    expect((await POST(jsonRequest("POST", { name: "Read" }))).status).toBe(500);
  });

  it("normalizes and creates a parent habit with child habits", async () => {
    const admin = chainResults([
      { data: { sort_order: 2 }, error: null },
      {
        data: { id: "parent", name: "Exercise plan", parent_habit_id: null, target_per_week: 7, sort_order: 3, active: true },
        error: null
      },
      {
        data: [{ id: "child", name: "Walk", parent_habit_id: "parent", target_per_week: 7, sort_order: 1, active: true }],
        error: null
      }
    ]);
    adminFactory.mockReturnValue(admin as never);

    const response = await POST(
      jsonRequest("POST", { name: " Exercise   plan ", targetPerWeek: 20, subHabits: [" Walk ", " "] })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      habit: { id: "parent", name: "Exercise plan", targetPerWeek: 7, sortOrder: 3, active: true },
      subHabits: [{ id: "child", name: "Walk", parentHabitId: "parent", targetPerWeek: 7, sortOrder: 1, active: true }]
    });
    expect(admin.inserted).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "Exercise plan", target_per_week: 7, sort_order: 3 })])
    );
  });

  it("creates child habits only when their parent exists", async () => {
    const missingParent = chainResults([{ data: null, error: null }]);
    adminFactory.mockReturnValue(missingParent as never);

    const response = await POST(jsonRequest("POST", { name: "Walk", parentHabitId: "missing" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Parent habit not found." });
  });

  it("surfaces parent, insert and child insert database failures", async () => {
    adminFactory.mockReturnValue(chainResults([{ data: null, error: { message: "parent query failed" } }]) as never);
    expect((await POST(jsonRequest("POST", { name: "Walk", parentHabitId: "parent" }))).status).toBe(500);

    adminFactory.mockReturnValue(
      chainResults([{ data: null, error: null }, { data: null, error: { message: "habit insert failed" } }]) as never
    );
    expect((await POST(jsonRequest("POST", { name: "Read" }))).status).toBe(500);

    adminFactory.mockReturnValue(
      chainResults([
        { data: null, error: null },
        { data: { id: "parent", name: "Read", parent_habit_id: null, target_per_week: 7, sort_order: 1, active: true }, error: null },
        { data: null, error: { message: "children insert failed" } }
      ]) as never
    );
    expect((await POST(jsonRequest("POST", { name: "Read", subHabits: ["Pages"] }))).status).toBe(500);
  });

  it("deletes a habit owned by the authenticated user", async () => {
    const admin = chainResults([]);
    adminFactory.mockReturnValue(admin as never);

    const response = await DELETE(jsonRequest("DELETE", { id: "habit" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(admin.deleted).toHaveLength(1);
  });

  it("validates and surfaces failed habit deletes", async () => {
    adminFactory.mockReturnValue(chainResults([]) as never);
    expect((await DELETE(jsonRequest("DELETE", {}))).status).toBe(400);

    adminFactory.mockReturnValue(chainResults([{ error: { message: "delete failed" } }]) as never);
    expect((await DELETE(jsonRequest("DELETE", { id: "habit" }))).status).toBe(500);
  });
});
