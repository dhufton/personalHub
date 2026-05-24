import { afterEach, describe, expect, it, vi } from "vitest";
import { ensureUserProfile } from "@/lib/auth/profile";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: vi.fn()
}));

const getAdminMock = vi.mocked(getSupabaseAdminClient);

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("ensureUserProfile", () => {
  it("does nothing when admin access is unavailable", async () => {
    getAdminMock.mockReturnValue(null);

    await expect(ensureUserProfile({ id: "u1" } as never)).resolves.toEqual({ error: null });
  });

  it("upserts a trimmed metadata profile and records the timestamp", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-24T10:00:00.000Z"));
    const upsert = vi.fn().mockResolvedValue({ error: null });
    getAdminMock.mockReturnValue({ from: vi.fn(() => ({ upsert })) } as never);

    await ensureUserProfile({
      id: "u1",
      email: "person@example.com",
      user_metadata: { display_name: "  Dylan H  ", avatar_url: " avatar.png " }
    } as never);

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "u1",
        display_name: "Dylan H",
        avatar_url: "avatar.png",
        updated_at: "2026-05-24T10:00:00.000Z"
      }),
      { onConflict: "id" }
    );
  });

  it("falls back to the email prefix for blank metadata", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: "failed" } });
    getAdminMock.mockReturnValue({ from: vi.fn(() => ({ upsert })) } as never);

    await expect(
      ensureUserProfile({ id: "u2", email: "local@example.com", user_metadata: { name: " " } } as never)
    ).resolves.toEqual({ error: { message: "failed" } });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ display_name: "local" }), expect.anything());
  });
});
