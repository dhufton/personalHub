import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ensureUserProfile } from "@/lib/auth/profile";
import { getDashboardData } from "@/lib/dashboard-service";
import { fetchAppleCalendarEvents } from "@/lib/integrations/apple-calendar";
import { sampleDashboardData } from "@/lib/sample-data";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

vi.mock("@/lib/auth/profile", () => ({ ensureUserProfile: vi.fn() }));
vi.mock("@/lib/integrations/apple-calendar", () => ({ fetchAppleCalendarEvents: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn() }));

const adminMock = vi.mocked(getSupabaseAdminClient);
const serverMock = vi.mocked(createServerSupabaseClient);

type Result = { data: unknown; error: null | { message: string } };

function adminWithResults(results: Record<string, Result>) {
  return {
    from: vi.fn((table: string) => {
      const query: Record<string, unknown> = {};
      for (const method of ["select", "eq", "is", "gte", "order", "limit"]) {
        query[method] = vi.fn(() => query);
      }
      query.returns = vi.fn().mockResolvedValue(results[table]);
      query.maybeSingle = vi.fn().mockResolvedValue(results[table]);
      return query;
    })
  };
}

function configuredRows(): Record<string, Result> {
  return {
    profiles: {
      data: {
        id: "u1",
        display_name: "Dylan Hufton",
        email: "user@example.com",
        role: "member",
        timezone: "Europe/London",
        home_currency: "GBP",
        week_starts_on: "Sunday",
        avatar_url: "/avatar.png"
      },
      error: null
    },
    tasks: {
      data: [
        {
          id: "task",
          title: "Task",
          description: null,
          urgency: null,
          key: null,
          priority_score: null,
          time_estimate_min: null,
          tags: null,
          due_date: null,
          owner: null,
          completed_at: null
        }
      ],
      error: null
    },
    calendar_events: {
      data: [
        {
          id: "database-event",
          title: "Stored event",
          event_date: "2026-05-24",
          start_time: "09:00:00",
          end_time: "10:00:00",
          location: null,
          source: null
        }
      ],
      error: null
    },
    habit_definitions: {
      data: [{ id: "habit", name: "Read", parent_habit_id: null, target_per_week: null, sort_order: null, active: null }],
      error: null
    },
    habit_entries: {
      data: [{ habit_id: "habit", log_date: "2026-05-24", completed: null }],
      error: null
    },
    finance_snapshots: {
      data: { id: "finance", as_of: "2026-05-24", currency: null, net_worth: null, categories: null, notes: null, source: null },
      error: null
    },
    user_integrations: {
      data: [
        {
          id: "apple",
          provider: "apple_calendar",
          display_name: null,
          status: "connected",
          access_mode: "public_ical",
          public_config: { ical_url: "https://icloud.com/feed" },
          last_synced_at: null,
          error_message: null
        },
        {
          id: "finance",
          provider: "manual_finance",
          display_name: null,
          status: null,
          access_mode: null,
          public_config: null,
          last_synced_at: null,
          error_message: "Connect later"
        }
      ],
      error: null
    }
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-24T12:00:00.000Z"));
  serverMock.mockResolvedValue(null);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("getDashboardData", () => {
  it("returns sample data without an admin client", async () => {
    adminMock.mockReturnValue(null);

    await expect(getDashboardData()).resolves.toBe(sampleDashboardData);
  });

  it("maps stored rows and uses connected Apple Calendar feed events", async () => {
    const results = configuredRows();
    adminMock.mockReturnValue(adminWithResults(results) as never);
    serverMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) }
    } as never);
    vi.mocked(fetchAppleCalendarEvents).mockResolvedValue([
      {
        id: "feed-event",
        title: "Feed event",
        date: "2026-05-24",
        startTime: "08:00",
        endTime: "09:00",
        source: "apple"
      }
    ]);

    const data = await getDashboardData();

    expect(ensureUserProfile).toHaveBeenCalledWith({ id: "u1" });
    expect(fetchAppleCalendarEvents).toHaveBeenCalledWith("https://icloud.com/feed");
    expect(data.profile).toMatchObject({ id: "u1", name: "Dylan Hufton", initials: "DH", role: "member" });
    expect(data.tasks[0]).toMatchObject({ urgency: "someday", key: false, priorityScore: 0, tags: [] });
    expect(data.calendarEvents[0].id).toBe("feed-event");
    expect(data.habits[0]).toMatchObject({ targetPerWeek: 7, sortOrder: 0, active: true });
    expect(data.habitLogs[0].completed).toBe(false);
    expect(data.financeSnapshot).toMatchObject({ currency: "GBP", netWorth: 0, categories: [] });
    expect(data.connectedAccounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Apple Calendar", description: "Per-user iCloud calendar feed", enabled: true }),
        expect.objectContaining({ name: "Manual finance", description: "Connect later", status: "needs_setup" })
      ])
    );
  });

  it("falls back to stored calendar rows when public feeds fail", async () => {
    adminMock.mockReturnValue(adminWithResults(configuredRows()) as never);
    vi.mocked(fetchAppleCalendarEvents).mockRejectedValue(new Error("feed unavailable"));

    const data = await getDashboardData();

    expect(data.calendarEvents).toEqual([
      expect.objectContaining({ id: "database-event", startTime: "09:00", endTime: "10:00", source: "placeholder" })
    ]);
  });

  it("uses configured fallback identity and default accounts for anonymous stored data", async () => {
    const rows = configuredRows();
    rows.profiles.data = null;
    rows.finance_snapshots.data = null;
    rows.user_integrations.data = [];
    vi.stubEnv("USER_ID", "configured-user");
    adminMock.mockReturnValue(adminWithResults(rows) as never);
    serverMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) }
    } as never);

    const data = await getDashboardData();

    expect(data.profile).toBe(sampleDashboardData.profile);
    expect(data.financeSnapshot).toBe(sampleDashboardData.financeSnapshot);
    expect(data.connectedAccounts).toBe(sampleDashboardData.connectedAccounts);
    expect(fetchAppleCalendarEvents).not.toHaveBeenCalled();
  });

  it("labels alternate integration providers and sorts merged feed events", async () => {
    const rows = configuredRows();
    rows.user_integrations.data = [
      ...(rows.user_integrations.data as object[]),
      {
        id: "second-apple",
        provider: "apple_calendar",
        display_name: "Work",
        status: "connected",
        access_mode: "public_ical",
        public_config: { ical_url: "https://icloud.com/work" },
        error_message: null
      },
      {
        id: "private-apple",
        provider: "apple_calendar",
        display_name: null,
        status: "disabled",
        access_mode: "caldav_vault",
        public_config: null,
        error_message: null
      },
      {
        id: "openai",
        provider: "openai",
        display_name: null,
        status: "needs_setup",
        access_mode: "server_secret",
        public_config: null,
        error_message: null
      }
    ];
    adminMock.mockReturnValue(adminWithResults(rows) as never);
    vi.mocked(fetchAppleCalendarEvents)
      .mockResolvedValueOnce([{ id: "later", title: "Later", date: "2026-05-25", startTime: "10:00", endTime: "11:00", source: "apple" }])
      .mockResolvedValueOnce([{ id: "first", title: "First", date: "2026-05-24", startTime: "All Day", endTime: "", allDay: true, source: "apple" }]);

    const data = await getDashboardData();

    expect(data.calendarEvents.map((event) => event.id)).toEqual(["first", "later"]);
    expect(data.connectedAccounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ description: "Private CalDAV credentials stored via Supabase Vault" }),
        expect.objectContaining({ name: "OpenAI", description: "Server-side OpenAI features" })
      ])
    );
  });

  it("returns sample data when a data query fails", async () => {
    const rows = configuredRows();
    rows.tasks.error = { message: "database unavailable" };
    adminMock.mockReturnValue(adminWithResults(rows) as never);

    await expect(getDashboardData()).resolves.toBe(sampleDashboardData);
  });
});
