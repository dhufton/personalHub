import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(),
  createServerClient: vi.fn()
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn()
}));
vi.mock("next/headers", () => ({
  cookies: vi.fn()
}));

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

function configurePublicEnv() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable");
}

describe("Supabase client factories", () => {
  it("returns null when browser or server public settings are unavailable", async () => {
    const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");

    expect(createBrowserSupabaseClient()).toBeNull();
    await expect(createServerSupabaseClient()).resolves.toBeNull();
  });

  it("builds a browser client using public settings", async () => {
    configurePublicEnv();
    vi.mocked(createBrowserClient).mockReturnValue("browser" as never);
    const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");

    expect(createBrowserSupabaseClient()).toBe("browser");
    expect(createBrowserClient).toHaveBeenCalledWith("https://project.supabase.co", "publishable");
  });

  it("bridges request cookies when building a server client", async () => {
    configurePublicEnv();
    const cookieStore = { getAll: vi.fn(() => [{ name: "token", value: "one" }]), set: vi.fn() };
    vi.mocked(cookies).mockResolvedValue(cookieStore as never);
    vi.mocked(createServerClient).mockReturnValue("server" as never);
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");

    expect(await createServerSupabaseClient()).toBe("server");
    const options = vi.mocked(createServerClient).mock.calls[0][2] as {
      cookies: { getAll: () => unknown; setAll: (values: Array<{ name: string; value: string }>) => void };
    };
    expect(options.cookies.getAll()).toEqual([{ name: "token", value: "one" }]);
    options.cookies.setAll([{ name: "fresh", value: "two" }]);
    expect(cookieStore.set).toHaveBeenCalledWith("fresh", "two", undefined);
  });

  it("creates and caches the admin client with a service key", async () => {
    configurePublicEnv();
    vi.stubEnv("SUPABASE_SECRET_KEY", "secret");
    vi.mocked(createClient).mockReturnValue("admin" as never);
    const { getSupabaseAdminClient } = await import("@/lib/supabase/admin");

    expect(getSupabaseAdminClient()).toBe("admin");
    expect(getSupabaseAdminClient()).toBe("admin");
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "secret",
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  });

  it("does not create an admin client without server credentials", async () => {
    const { getSupabaseAdminClient } = await import("@/lib/supabase/admin");

    expect(getSupabaseAdminClient()).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });
});
