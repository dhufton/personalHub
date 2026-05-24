import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as dashboardGET } from "@/app/api/dashboard/route";
import { GET as callbackGET } from "@/app/auth/callback/route";
import { POST as logoutPOST } from "@/app/auth/logout/route";
import { ensureUserProfile } from "@/lib/auth/profile";
import { getDashboardData } from "@/lib/dashboard-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { proxy } from "@/proxy";
import { updateSession } from "@/lib/supabase/middleware";

vi.mock("@/lib/auth/profile", () => ({ ensureUserProfile: vi.fn() }));
vi.mock("@/lib/dashboard-service", () => ({ getDashboardData: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn() }));
vi.mock("@/lib/supabase/middleware", () => ({ updateSession: vi.fn() }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("lightweight server routes", () => {
  it("serves dashboard service output as JSON", async () => {
    vi.mocked(getDashboardData).mockResolvedValue({ profile: { id: "u1" } } as never);

    const response = await dashboardGET();

    await expect(response.json()).resolves.toEqual({ profile: { id: "u1" } });
  });

  it("exchanges callback codes, provisions the user, and honors the next destination", async () => {
    const auth = {
      exchangeCodeForSession: vi.fn().mockResolvedValue(undefined),
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } })
    };
    vi.mocked(createServerSupabaseClient).mockResolvedValue({ auth } as never);

    const response = await callbackGET(
      new NextRequest("https://personal.test/auth/callback?code=abc&next=%2Fsettings")
    );

    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(ensureUserProfile).toHaveBeenCalledWith({ id: "u1" });
    expect(response.headers.get("location")).toBe("https://personal.test/settings");
  });

  it("redirects callbacks without a code to the dashboard", async () => {
    const response = await callbackGET(new NextRequest("https://personal.test/auth/callback"));

    expect(response.headers.get("location")).toBe("https://personal.test/dashboard");
    expect(createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it("signs out before redirecting to login", async () => {
    const signOut = vi.fn().mockResolvedValue(undefined);
    vi.mocked(createServerSupabaseClient).mockResolvedValue({ auth: { signOut } } as never);

    const response = await logoutPOST(new NextRequest("https://personal.test/auth/logout", { method: "POST" }));

    expect(signOut).toHaveBeenCalled();
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://personal.test/login");
  });

  it("delegates the application proxy to session middleware", async () => {
    const request = new NextRequest("https://personal.test/dashboard");
    const response = new Response(null, { status: 204 });
    vi.mocked(updateSession).mockResolvedValue(response as never);

    await expect(proxy(request)).resolves.toBe(response);
    expect(updateSession).toHaveBeenCalledWith(request);
  });
});
