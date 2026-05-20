export type UserProfile = {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarUrl?: string;
  role: "admin" | "member";
  timezone: string;
  homeCurrency: "GBP" | "USD" | "EUR";
  weekStartsOn: "Monday" | "Sunday";
};

export type TaskUrgency = "today" | "this_week" | "this_month" | "someday";

export type Task = {
  id: string;
  title: string;
  description?: string;
  urgency: TaskUrgency;
  key: boolean;
  priorityScore: number;
  timeEstimateMin?: number;
  tags: string[];
  dueDate?: string;
  owner?: string;
  completedAt?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  source: "placeholder" | "apple";
};

export type HabitDefinition = {
  id: string;
  name: string;
  targetPerWeek: number;
  sortOrder: number;
  active: boolean;
};

export type HabitLog = {
  habitId: string;
  date: string;
  completed: boolean;
};

export type FinanceCategory = {
  id: string;
  name: string;
  value: number;
  kind: "asset" | "liability";
};

export type FinanceSnapshot = {
  id: string;
  asOf: string;
  currency: "GBP" | "USD" | "EUR";
  netWorth: number;
  categories: FinanceCategory[];
  notes: string[];
  source: "placeholder" | "manual" | "openai_import";
};

export type IntegrationProvider = "apple_calendar" | "manual_finance" | "openai";
export type IntegrationStatus = "connected" | "needs_setup" | "disabled" | "error";
export type IntegrationAccessMode = "public_ical" | "caldav_vault" | "server_secret" | "manual";

export type ConnectedAccount = {
  id: string;
  name: string;
  description: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  accessMode: IntegrationAccessMode;
  enabled: boolean;
  publicConfig?: Record<string, unknown>;
};

export type DashboardData = {
  profile: UserProfile;
  tasks: Task[];
  calendarEvents: CalendarEvent[];
  habits: HabitDefinition[];
  habitLogs: HabitLog[];
  financeSnapshot: FinanceSnapshot;
  connectedAccounts: ConnectedAccount[];
};
