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
      title: "Add Apple Calendar link when ready",
      urgency: "this_week",
      key: false,
      priorityScore: 64,
      timeEstimateMin: 15,
      tags: ["apple", "calendar"]
    },
    {
      id: "task_4",
      title: "Choose the first finance import source",
      urgency: "this_week",
      key: true,
      priorityScore: 72,
      timeEstimateMin: 30,
      tags: ["finance", "integration"]
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
    { id: "habit_train", name: "Exercise", targetPerWeek: 4, sortOrder: 1, active: true },
    { id: "habit_walk_10", name: "Walk 10 mins", parentHabitId: "habit_train", targetPerWeek: 4, sortOrder: 1, active: true },
    { id: "habit_gym", name: "Go to gym", parentHabitId: "habit_train", targetPerWeek: 4, sortOrder: 2, active: true },
    { id: "habit_lift", name: "Lift weights", parentHabitId: "habit_train", targetPerWeek: 4, sortOrder: 3, active: true },
    { id: "habit_read", name: "Read", targetPerWeek: 5, sortOrder: 2, active: true },
    { id: "habit_water", name: "Water", targetPerWeek: 7, sortOrder: 3, active: true },
    { id: "habit_walk", name: "Walk", targetPerWeek: 5, sortOrder: 4, active: true },
    { id: "habit_plan", name: "Plan tomorrow", targetPerWeek: 5, sortOrder: 5, active: true },
    { id: "habit_sleep", name: "Sleep routine", targetPerWeek: 5, sortOrder: 6, active: true }
  ],
  habitLogs: [
    { habitId: "habit_train", date: "2026-05-18", completed: true },
    { habitId: "habit_train", date: "2026-05-19", completed: true },
    { habitId: "habit_walk_10", date: "2026-05-18", completed: true },
    { habitId: "habit_gym", date: "2026-05-18", completed: true },
    { habitId: "habit_lift", date: "2026-05-18", completed: true },
    { habitId: "habit_walk_10", date: "2026-05-19", completed: true },
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
    notes: ["Placeholder snapshot. Add manual snapshots or an OpenAI import pipeline later."]
  },
  connectedAccounts: [
    {
      id: "conn_apple_calendar",
      name: "Apple Calendar",
      description: "Per-user iCloud calendar feed",
      provider: "apple_calendar",
      status: "needs_setup",
      accessMode: "public_ical",
      enabled: false
    },
    {
      id: "conn_manual_finance",
      name: "Manual finance",
      description: "Finance snapshots stored per user",
      provider: "manual_finance",
      status: "needs_setup",
      accessMode: "manual",
      enabled: false
    },
    {
      id: "conn_openai",
      name: "OpenAI",
      description: "Server-side AI features when enabled",
      provider: "openai",
      status: "needs_setup",
      accessMode: "server_secret",
      enabled: false
    }
  ]
};
