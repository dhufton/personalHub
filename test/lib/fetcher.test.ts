import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchJson } from "@/lib/fetcher";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchJson", () => {
  it("returns the parsed response body when the request succeeds", async () => {
    const json = vi.fn().mockResolvedValue({ status: "ok" });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchJson<{ status: string }>("/api/dashboard")).resolves.toEqual({ status: "ok" });
    expect(fetchMock).toHaveBeenCalledWith("/api/dashboard");
  });

  it("throws a status-specific error for failed responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    await expect(fetchJson("/api/dashboard")).rejects.toThrow("Request failed: 503");
  });
});
