import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/middleware";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn()
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

function request(pathname: string) {
  return new NextRequest(`https://personal.test${pathname}`);
}

function configureAuth(user: object | null) {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable");
  vi.mocked(createServerClient).mockReturnValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) }
  } as never);
}

describe("updateSession", () => {
  it("passes through requests when Supabase auth is not configured", async () => {
    const response = await updateSession(request("/dashboard"));

    expect(response.status).toBe(200);
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it("redirects anonymous protected requests to login while preserving the destination", async () => {
    configureAuth(null);

    const response = await updateSession(request("/settings"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://personal.test/login?next=%2Fsettings");
  });

  it("returns a refreshed response for authenticated requests and forwards cookies", async () => {
    configureAuth({ id: "u1" });

    const responsePromise = updateSession(request("/dashboard"));
    const options = vi.mocked(createServerClient).mock.calls[0][2] as unknown as {
      cookies: {
        getAll: () => unknown[];
        setAll: (values: Array<{ name: string; value: string; options?: object }>) => void;
      };
    };
    expect(options.cookies.getAll()).toEqual([]);
    options.cookies.setAll([{ name: "session", value: "fresh", options: { path: "/" } }]);
    const response = await responsePromise;

    expect(response.status).toBe(200);
    expect(response.cookies.get("session")?.value).toBe("fresh");
  });
});
