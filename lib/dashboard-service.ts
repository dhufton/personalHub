import { getConfiguredUserId } from "@/lib/env";
import { ensureUserProfile } from "@/lib/auth/profile";
import { fetchAppleCalendarEvents } from "@/lib/integrations/apple-calendar";
import { DEMO_USER_ID, sampleDashboardData } from "@/lib/sample-data";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CalendarEvent,
  DashboardData,
  FinanceCategory,
  FinanceSnapshot,
  HabitDefinition,
  HabitLog,
  IntegrationAccessMode,
  IntegrationProvider,
  IntegrationStatus,
  Task,
  TaskUrgency,
  UserProfile
} from "@/lib/types";

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  role: "admin" | "member" | null;
  timezone: string | null;
  home_currency: "GBP" | "USD" | "EUR" | null;
  week_starts_on: "Monday" | "Sunday" | null;
  avatar_url: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  urgency: TaskUrgency | null;
  key: boolean | null;
  priority_score: number | null;
  time_estimate_min: number | null;
  tags: string[] | null;
  due_date: string | null;
  owner: string | null;
  completed_at: string | null;
};

type CalendarEventRow = {
  id: string;
  title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  source: "placeholder" | "apple" | null;
};

type HabitRow = {
  id: string;
  name: string;
  target_per_week: number | null;
  sort_order: number | null;
  active: boolean | null;
};

type HabitLogRow = {
  habit_id: string;
  log_date: string;
  completed: boolean | null;
};

type FinanceSnapshotRow = {
  id: string;
  as_of: string;
  currency: "GBP" | "USD" | "EUR" | null;
  net_worth: number | null;
  categories: FinanceCategory[] | null;
  notes: string[] | null;
  source: "placeholder" | "manual" | "openai_import" | null;
};

type IntegrationRow = {
  id: string;
  provider: IntegrationProvider;
  display_name: string | null;
  status: IntegrationStatus | null;
  access_mode: IntegrationAccessMode | null;
  public_config: Record<string, unknown> | null;
  last_synced_at: string | null;
  error_message: string | null;
};

export async function getDashboardData(): Promise<DashboardData> {
  const { userId } = await resolveUserContext();
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return sampleDashboardData;
  }

  const [profileResult, tasksResult, calendarResult, habitsResult, habitLogsResult, financeResult, integrationsResult] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle<ProfileRow>(),
      supabase
        .from("tasks")
        .select("id,title,description,urgency,key,priority_score,time_estimate_min,tags,due_date,owner,completed_at")
        .eq("user_id", userId)
        .is("completed_at", null)
        .order("priority_score", { ascending: false })
        .limit(12)
        .returns<TaskRow[]>(),
      supabase
        .from("calendar_events")
        .select("id,title,event_date,start_time,end_time,location,source")
        .eq("user_id", userId)
        .gte("event_date", localDateKey(new Date()))
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(14)
        .returns<CalendarEventRow[]>(),
      supabase
        .from("habit_definitions")
        .select("id,name,target_per_week,sort_order,active")
        .eq("user_id", userId)
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .returns<HabitRow[]>(),
      supabase
        .from("habit_entries")
        .select("habit_id,log_date,completed")
        .eq("user_id", userId)
        .gte("log_date", sevenDaysAgoKey())
        .returns<HabitLogRow[]>(),
      supabase
        .from("finance_snapshots")
        .select("id,as_of,currency,net_worth,categories,notes,source")
        .eq("user_id", userId)
        .order("as_of", { ascending: false })
        .limit(1)
        .maybeSingle<FinanceSnapshotRow>(),
      supabase
        .from("user_integrations")
        .select("id,provider,display_name,status,access_mode,public_config,last_synced_at,error_message")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .returns<IntegrationRow[]>()
    ]);

  if (
    profileResult.error ||
    tasksResult.error ||
    calendarResult.error ||
    habitsResult.error ||
    habitLogsResult.error ||
    financeResult.error ||
    integrationsResult.error
  ) {
    return sampleDashboardData;
  }

  const integrations = integrationsResult.data ?? [];
  const appleEvents = await getAppleCalendarEvents(integrations);

  return {
    profile: mapProfile(profileResult.data),
    tasks: (tasksResult.data ?? []).map(mapTask),
    calendarEvents: appleEvents ?? (calendarResult.data ?? []).map(mapCalendarEvent),
    habits: (habitsResult.data ?? []).map(mapHabit),
    habitLogs: (habitLogsResult.data ?? []).map(mapHabitLog),
    financeSnapshot: mapFinanceSnapshot(financeResult.data),
    connectedAccounts: mapIntegrations(integrations)
  };
}

async function resolveUserContext() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { userId: getConfiguredUserId(DEMO_USER_ID) };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    await ensureUserProfile(user);
    return { userId: user.id };
  }

  return { userId: getConfiguredUserId(DEMO_USER_ID) };
}

function mapProfile(row?: ProfileRow | null): UserProfile {
  if (!row) return sampleDashboardData.profile;

  const name = row.display_name ?? sampleDashboardData.profile.name;

  return {
    id: row.id,
    name,
    email: row.email ?? sampleDashboardData.profile.email,
    initials: initialsForName(name),
    avatarUrl: row.avatar_url ?? undefined,
    role: row.role ?? "admin",
    timezone: row.timezone ?? "Europe/London",
    homeCurrency: row.home_currency ?? "GBP",
    weekStartsOn: row.week_starts_on ?? "Monday"
  };
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    urgency: row.urgency ?? "someday",
    key: row.key ?? false,
    priorityScore: row.priority_score ?? 0,
    timeEstimateMin: row.time_estimate_min ?? undefined,
    tags: row.tags ?? [],
    dueDate: row.due_date ?? undefined,
    owner: row.owner ?? undefined,
    completedAt: row.completed_at ?? undefined
  };
}

function mapCalendarEvent(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.event_date,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    location: row.location ?? undefined,
    source: row.source ?? "placeholder"
  };
}

function mapHabit(row: HabitRow): HabitDefinition {
  return {
    id: row.id,
    name: row.name,
    targetPerWeek: row.target_per_week ?? 7,
    sortOrder: row.sort_order ?? 0,
    active: row.active ?? true
  };
}

function mapHabitLog(row: HabitLogRow): HabitLog {
  return {
    habitId: row.habit_id,
    date: row.log_date,
    completed: row.completed ?? false
  };
}

function mapFinanceSnapshot(row?: FinanceSnapshotRow | null): FinanceSnapshot {
  if (!row) return sampleDashboardData.financeSnapshot;

  return {
    id: row.id,
    asOf: row.as_of,
    currency: row.currency ?? "GBP",
    netWorth: row.net_worth ?? 0,
    categories: row.categories ?? [],
    notes: row.notes ?? [],
    source: row.source ?? "placeholder"
  };
}

function mapIntegrations(rows: IntegrationRow[]) {
  if (!rows.length) {
    return sampleDashboardData.connectedAccounts;
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.display_name ?? labelForProvider(row.provider),
    description: descriptionForIntegration(row),
    provider: row.provider,
    status: row.status ?? "needs_setup",
    accessMode: row.access_mode ?? "manual",
    enabled: row.status === "connected",
    publicConfig: row.public_config ?? undefined
  }));
}

async function getAppleCalendarEvents(rows: IntegrationRow[]) {
  const integrations = rows.filter(
    (row) => row.provider === "apple_calendar" && row.status === "connected" && row.access_mode === "public_ical"
  );

  if (!integrations.length) {
    return null;
  }

  const results = await Promise.all(
    integrations.map(async (integration) => {
      const icalUrl = integration.public_config?.ical_url;
      if (typeof icalUrl !== "string" || !icalUrl) return [];

      try {
        const events = await fetchAppleCalendarEvents(icalUrl);
        return events.map((event) => ({
          ...event,
          title: integration.display_name ? `${event.title}` : event.title
        }));
      } catch {
        return [];
      }
    })
  );

  const events = results.flat().sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  if (!events.length) {
    return null;
  }

  return events;
}

function labelForProvider(provider: IntegrationProvider) {
  if (provider === "apple_calendar") return "Apple Calendar";
  if (provider === "manual_finance") return "Manual finance";
  return "OpenAI";
}

function descriptionForIntegration(row: IntegrationRow) {
  if (row.error_message) return row.error_message;
  if (row.provider === "apple_calendar" && row.access_mode === "public_ical") {
    return "Per-user iCloud calendar feed";
  }
  if (row.provider === "apple_calendar" && row.access_mode === "caldav_vault") {
    return "Private CalDAV credentials stored via Supabase Vault";
  }
  if (row.provider === "manual_finance") return "Finance snapshots stored per user";
  return "Server-side OpenAI features";
}

function initialsForName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function localDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function sevenDaysAgoKey() {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  return localDateKey(date);
}
