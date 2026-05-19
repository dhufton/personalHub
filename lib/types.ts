export type UserProfile = {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarUrl?: string;
  homeCurrency: "GBP" | "USD" | "EUR";
  weekStartsOn: "Monday" | "Sunday";
};

export type Reminder = {
  id: string;
  title: string;
  dueLabel: string;
  category: string;
  completed: boolean;
};

export type CalendarEvent = {
  id: string;
  title: string;
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  startHour: number;
  durationHours: number;
  location?: string;
};

export type MonthEvent = {
  id: string;
  date: string;
  label: string;
};

export type Account = {
  id: string;
  name: string;
  balance: number;
  currency: "GBP";
  kind: "current" | "savings" | "credit";
};

export type SavingsGoal = {
  id: string;
  name: string;
  current: number;
  target: number;
};

export type Bill = {
  id: string;
  name: string;
  dueDate: string;
  amount: number;
};

export type Subscription = Bill & {
  reviewed: boolean;
};

export type Transaction = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
};

export type Habit = {
  id: string;
  name: string;
  week: boolean[];
};

export type ConnectedAccount = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

export type DashboardData = {
  profile: UserProfile;
  reminders: Reminder[];
  calendarEvents: CalendarEvent[];
  monthEvents: MonthEvent[];
  accounts: Account[];
  savingsGoals: SavingsGoal[];
  bills: Bill[];
  subscriptions: Subscription[];
  transactions: Transaction[];
  habits: Habit[];
  connectedAccounts: ConnectedAccount[];
};
