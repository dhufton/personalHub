import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ensureUserProfile } from "@/lib/auth/profile";
import { DELETE, PATCH, POST } from "@/app/api/integrations/apple-calendar/route";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

vi.mock("@/lib/auth/profile", () => ({ ensureUserProfile: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn() }));

const adminFactory = vi.mocked(getSupabaseAdminClient);
const serverFactory = vi.mocked(createServerSupabaseClient);

function request(method: string, body: unknown) {
  return new NextRequest("https://personal.test/api/integrations/apple-calendar", {
    method,
    body: JSON.stringify(body)
  });
}

function adminWithResults(results: Array<{ data?: unknown; error?: unknown }>) {
  const written: unknown[] = [];
  return {
    written,
    from: vi.fn(() => {
      const query: Record<string, unknown> = {};
      for (const method of ["select", "eq"]) {
        query[method] = vi.fn(() => query);
      }
      for (const method of ["insert", "update"]) {
        query[method] = vi.fn((payload) => {
          written.push(payload);
          return query;
        });
      }
      query.delete = vi.fn(() => query);
      query.maybeSingle = vi.fn().mockImplementation(async () => results.shift() ?? { data: null, error: null });
      query.single = vi.fn().mockImplementation(async () => results.shift() ?? { data: null, error: null });
      query.then = (resolve: (value: unknown) => void, reject: (reason: unknown) => void) =>
        Promise.resolve(results.shift() ?? { data: null, error: null }).then(resolve, reject);
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

describe("Apple Calendar integration routes", () => {
  it("requires configured services, authentication and profile provisioning when adding a feed", async () => {
    serverFactory.mockResolvedValue(null);
    adminFactory.mockReturnValue(null);
    expect((await POST(request("POST", { icalUrl: "https://icloud.com/feed" }))).status).toBe(503);

    adminFactory.mockReturnValue(adminWithResults([]) as never);
    serverFactory.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) }
    } as never);
    expect((await POST(request("POST", { icalUrl: "https://icloud.com/feed" }))).status).toBe(401);

    serverFactory.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) }
    } as never);
    vi.mocked(ensureUserProfile).mockResolvedValue({ error: { message: "profile failed" } } as never);
    expect((await POST(request("POST", { icalUrl: "https://icloud.com/feed" }))).status).toBe(500);
  });

  it("rejects calendar URLs outside public iCloud feeds", async () => {
    adminFactory.mockReturnValue(adminWithResults([]) as never);

    const response = await POST(request("POST", { icalUrl: "https://calendar.example/feed.ics" }));

    expect(response.status).toBe(400);
    expect((await POST(request("POST", { icalUrl: "https://[invalid" }))).status).toBe(400);
  });

  it("normalizes and inserts a webcal feed with validated colour", async () => {
    const admin = adminWithResults([{ data: null, error: null }, { data: { id: "calendar" }, error: null }]);
    adminFactory.mockReturnValue(admin as never);

    const response = await POST(
      request("POST", { displayName: "Home", icalUrl: "webcal://p01-caldav.icloud.com/feed.ics", color: "#ff3b30" })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, id: "calendar" });
    expect(admin.written[0]).toMatchObject({
      display_name: "Home",
      public_config: {
        ical_url: "https://p01-caldav.icloud.com/feed.ics",
        original_url_scheme: "webcal",
        color: "#ff3b30"
      }
    });
  });

  it("updates an already connected feed and surfaces query or write failures", async () => {
    adminFactory.mockReturnValue(adminWithResults([{ data: null, error: { message: "lookup failed" } }]) as never);
    expect((await POST(request("POST", { icalUrl: "https://icloud.com/feed" }))).status).toBe(500);

    adminFactory.mockReturnValue(
      adminWithResults([{ data: { id: "existing" }, error: null }, { data: null, error: null }]) as never
    );
    const updated = await POST(request("POST", { icalUrl: "https://icloud.com/feed" }));
    await expect(updated.json()).resolves.toEqual({ ok: true, id: "existing" });

    adminFactory.mockReturnValue(
      adminWithResults([{ data: null, error: null }, { data: null, error: { message: "write failed" } }]) as never
    );
    expect((await POST(request("POST", { icalUrl: "https://icloud.com/feed" }))).status).toBe(500);
  });

  it("updates an existing calendar and falls back to the default colour", async () => {
    const admin = adminWithResults([
      { data: { public_config: { ical_url: "https://icloud.com/feed" } }, error: null },
      { data: null, error: null }
    ]);
    adminFactory.mockReturnValue(admin as never);

    const response = await PATCH(request("PATCH", { id: "calendar", displayName: "", color: "invalid", enabled: false }));

    expect(response.status).toBe(200);
    expect(admin.written[0]).toMatchObject({
      display_name: "Apple Calendar",
      status: "disabled",
      public_config: { color: "#0a84ff" }
    });
  });

  it("returns not found when patching a missing calendar", async () => {
    adminFactory.mockReturnValue(adminWithResults([{ data: null, error: null }]) as never);

    const response = await PATCH(request("PATCH", { id: "missing" }));

    expect(response.status).toBe(404);
  });

  it("validates and surfaces failed calendar updates", async () => {
    adminFactory.mockReturnValue(adminWithResults([]) as never);
    expect((await PATCH(request("PATCH", {}))).status).toBe(400);

    adminFactory.mockReturnValue(adminWithResults([{ data: null, error: { message: "lookup failed" } }]) as never);
    expect((await PATCH(request("PATCH", { id: "calendar" }))).status).toBe(500);

    adminFactory.mockReturnValue(
      adminWithResults([{ data: { public_config: null }, error: null }, { data: null, error: { message: "write failed" } }]) as never
    );
    expect((await PATCH(request("PATCH", { id: "calendar" }))).status).toBe(500);
  });

  it("requires services and authentication for updates and deletes", async () => {
    serverFactory.mockResolvedValue(null);
    adminFactory.mockReturnValue(null);
    expect((await PATCH(request("PATCH", { id: "calendar" }))).status).toBe(503);
    expect((await DELETE(request("DELETE", { id: "calendar" }))).status).toBe(503);

    serverFactory.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) }
    } as never);
    adminFactory.mockReturnValue(adminWithResults([]) as never);
    expect((await PATCH(request("PATCH", { id: "calendar" }))).status).toBe(401);
    expect((await DELETE(request("DELETE", { id: "calendar" }))).status).toBe(401);
  });

  it("deletes an owned calendar", async () => {
    adminFactory.mockReturnValue(adminWithResults([{ data: null, error: null }]) as never);

    const response = await DELETE(request("DELETE", { id: "calendar" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("validates and surfaces failed calendar deletes", async () => {
    adminFactory.mockReturnValue(adminWithResults([]) as never);
    expect((await DELETE(request("DELETE", {}))).status).toBe(400);

    adminFactory.mockReturnValue(adminWithResults([{ data: null, error: { message: "delete failed" } }]) as never);
    expect((await DELETE(request("DELETE", { id: "calendar" }))).status).toBe(500);
  });
});
