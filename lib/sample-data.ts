import type { DashboardData } from "@/lib/types";

export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

export const sampleDashboardData: DashboardData = {
  profile: {
    id: DEMO_USER_ID,
    name: "Dylan",
    email: "dylan@example.com",
    initials: "D",
    role: "admin",
    timezone: "Europe/London",
    homeCurrency: "GBP",
    weekStartsOn: "Monday"
  },
  tasks: [
    {
      id: "task_1",
      title: "Review the Personal OS build scope",
      description: "Confirm the first dashboard surface before adding capture or memory.",
      urgency: "today",
      key: true,
      priorityScore: 94,
      timeEstimateMin: 35,
      tags: ["planning", "personal-os"],
      dueDate: "2026-05-20"
    },
    {
      id: "task_2",
      title: "Create Supabase project and apply schema",
      urgency: "today",
      key: true,
      priorityScore: 88,
      timeEstimateMin: 45,
      tags: ["supabase", "setup"],
      dueDate: "2026-05-20"
    },
    {
      id: "task_3",
      title: "Add Google Calendar iCal URL when ready",
      urgency: "this_week",
      key: false,
      priorityScore: 64,
      timeEstimateMin: 15,
      tags: ["calendar", "integration"]
    },
    {
      id: "task_4",
      title: "Prepare finance sheet service-account access",
      urgency: "this_week",
      key: true,
      priorityScore: 72,
      timeEstimateMin: 30,
      tags: ["finance", "google"]
    }
  ],
  calendarEvents: [
    {
      id: "evt_1",
      title: "Personal OS planning",
      date: "2026-05-20",
      startTime: "09:30",
      endTime: "10:15",
      source: "placeholder"
    },
    {
      id: "evt_2",
      title: "Finance review",
      date: "2026-05-20",
      startTime: "12:30",
      endTime: "13:00",
      location: "Desk",
      source: "placeholder"
    },
    {
      id: "evt_3",
      title: "Deep work block",
      date: "2026-05-21",
      startTime: "10:00",
      endTime: "12:00",
      source: "placeholder"
    },
    {
      id: "evt_4",
      title: "Weekly reset",
      date: "2026-05-24",
      startTime: "17:00",
      endTime: "17:45",
      source: "placeholder"
    }
  ],
  habits: [
    { id: "habit_train", name: "Train", targetPerWeek: 4, sortOrder: 1, active: true },
    { id: "habit_read", name: "Read", targetPerWeek: 5, sortOrder: 2, active: true },
    { id: "habit_water", name: "Water", targetPerWeek: 7, sortOrder: 3, active: true },
    { id: "habit_walk", name: "Walk", targetPerWeek: 5, sortOrder: 4, active: true },
    { id: "habit_plan", name: "Plan tomorrow", targetPerWeek: 5, sortOrder: 5, active: true },
    { id: "habit_sleep", name: "Sleep routine", targetPerWeek: 5, sortOrder: 6, active: true }
  ],
  habitLogs: [
    { habitId: "habit_train", date: "2026-05-18", completed: true },
    { habitId: "habit_train", date: "2026-05-19", completed: true },
    { habitId: "habit_read", date: "2026-05-18", completed: true },
    { habitId: "habit_read", date: "2026-05-20", completed: true },
    { habitId: "habit_water", date: "2026-05-18", completed: true },
    { habitId: "habit_water", date: "2026-05-19", completed: true },
    { habitId: "habit_water", date: "2026-05-20", completed: true },
    { habitId: "habit_walk", date: "2026-05-19", completed: true },
    { habitId: "habit_plan", date: "2026-05-19", completed: true },
    { habitId: "habit_sleep", date: "2026-05-18", completed: true }
  ],
  financeSnapshot: {
    id: "finance_demo",
    asOf: "2026-05-20T08:00:00.000Z",
    currency: "GBP",
    netWorth: 17076,
    source: "placeholder",
    categories: [
      { id: "cat_cash", name: "Cash", value: 4820, kind: "asset" },
      { id: "cat_savings", name: "Savings", value: 12640, kind: "asset" },
      { id: "cat_investments", name: "Investments", value: 0, kind: "asset" },
      { id: "cat_credit", name: "Credit card", value: -384, kind: "liability" }
    ],
    notes: ["Placeholder snapshot. Connect a Google Sheet later to replace this."]
  },
  connectedAccounts: [
    {
      id: "conn_supabase",
      name: "Supabase",
      description: "Auth and Postgres storage framework",
      enabled: false
    },
    {
      id: "conn_calendar",
      name: "Google Calendar",
      description: "iCal URL integration planned",
      enabled: false
    },
    {
      id: "conn_finance",
      name: "Google Sheets",
      description: "Finance extraction service-account integration planned",
      enabled: false
    }
  ]
};
