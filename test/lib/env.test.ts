import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getConfiguredUserId,
  getPublicSiteUrl,
  getSupabasePublishableKey,
  getSupabaseSecretKey,
  getSupabaseUrl,
  hasSupabasePublicEnv
} from "@/lib/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("environment helpers", () => {
  it("reads primary public and private Supabase settings", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable");
    vi.stubEnv("SUPABASE_SECRET_KEY", "secret");
    vi.stubEnv("USER_ID", "configured-user");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://personal.test");

    expect(getSupabaseUrl()).toBe("https://project.supabase.co");
    expect(getSupabasePublishableKey()).toBe("publishable");
    expect(getSupabaseSecretKey()).toBe("secret");
    expect(hasSupabasePublicEnv()).toBe(true);
    expect(getConfiguredUserId("fallback")).toBe("configured-user");
    expect(getPublicSiteUrl()).toBe("https://personal.test");
  });

  it("supports legacy key names and fallback user IDs", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("SUPABASE_SECRET_KEY", undefined);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
    vi.stubEnv("USER_ID", undefined);

    expect(getSupabasePublishableKey()).toBe("anon");
    expect(getSupabaseSecretKey()).toBe("service-role");
    expect(hasSupabasePublicEnv()).toBe(false);
    expect(getConfiguredUserId("fallback")).toBe("fallback");
  });
});
