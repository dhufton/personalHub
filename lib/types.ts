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
  source: "placeholder" | "google";
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
  source: "placeholder" | "google_sheet";
};

export type ConnectedAccount = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
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
