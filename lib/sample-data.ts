import type { DashboardData } from "@/lib/types";

export const sampleDashboardData: DashboardData = {
  profile: {
    id: "user_dylan",
    name: "Dylan",
    email: "dylan@icloud.com",
    initials: "D",
    homeCurrency: "GBP",
    weekStartsOn: "Monday"
  },
  reminders: [
    { id: "rem_1", title: "Send revised homepage notes", dueLabel: "Due 11:00", category: "Work", completed: false },
    { id: "rem_2", title: "Pay electricity bill", dueLabel: "Completed 08:42", category: "Home", completed: true },
    { id: "rem_3", title: "Book Friday train", dueLabel: "Due tonight", category: "Travel", completed: false },
    { id: "rem_4", title: "Order groceries for Thursday", dueLabel: "Due 18:00", category: "Home", completed: false }
  ],
  calendarEvents: [
    { id: "evt_1", title: "Planning", day: "Mon", startHour: 9, durationHours: 1 },
    { id: "evt_2", title: "Client sync", day: "Mon", startHour: 11, durationHours: 1, location: "Zoom" },
    { id: "evt_3", title: "Inbox clear", day: "Tue", startHour: 9, durationHours: 1 },
    { id: "evt_4", title: "Homepage notes", day: "Tue", startHour: 10, durationHours: 1 },
    { id: "evt_5", title: "Design review", day: "Tue", startHour: 13, durationHours: 1, location: "Studio" },
    { id: "evt_6", title: "Deep work", day: "Wed", startHour: 10, durationHours: 2 },
    { id: "evt_7", title: "Finance check", day: "Wed", startHour: 14, durationHours: 1 },
    { id: "evt_8", title: "Prototype pass", day: "Thu", startHour: 11, durationHours: 1 },
    { id: "evt_9", title: "Train", day: "Fri", startHour: 14, durationHours: 1 }
  ],
  monthEvents: [
    { id: "month_1", date: "2026-05-01", label: "Rent paid" },
    { id: "month_2", date: "2026-05-06", label: "Dentist" },
    { id: "month_3", date: "2026-05-14", label: "Subscription review" },
    { id: "month_4", date: "2026-05-16", label: "Family dinner" },
    { id: "month_5", date: "2026-05-19", label: "Design review" },
    { id: "month_6", date: "2026-05-20", label: "Finance check" },
    { id: "month_7", date: "2026-05-22", label: "Train" },
    { id: "month_8", date: "2026-05-28", label: "Council tax" }
  ],
  accounts: [
    { id: "acc_current", name: "Current", balance: 4820, currency: "GBP", kind: "current" },
    { id: "acc_savings", name: "Savings", balance: 12640, currency: "GBP", kind: "savings" },
    { id: "acc_credit", name: "Credit", balance: -384, currency: "GBP", kind: "credit" }
  ],
  savingsGoals: [
    { id: "goal_emergency", name: "Emergency fund", current: 6800, target: 10000 },
    { id: "goal_japan", name: "Japan trip", current: 1950, target: 3200 }
  ],
  bills: [
    { id: "bill_council_tax", name: "Council tax", dueDate: "28 May", amount: 171 },
    { id: "bill_internet", name: "Internet", dueDate: "31 May", amount: 36 },
    { id: "bill_phone", name: "Phone", dueDate: "2 Jun", amount: 24 }
  ],
  subscriptions: [
    { id: "sub_netflix", name: "Netflix", dueDate: "22 May", amount: 10.99, reviewed: false },
    { id: "sub_icloud", name: "iCloud", dueDate: "Reviewed", amount: 8.99, reviewed: true },
    { id: "sub_spotify", name: "Spotify", dueDate: "4 Jun", amount: 11.99, reviewed: false }
  ],
  transactions: [
    { id: "txn_waitrose", merchant: "Waitrose", category: "Groceries", amount: -42.8 },
    { id: "txn_trainline", merchant: "Trainline", category: "Travel", amount: -28.9 },
    { id: "txn_invoice", merchant: "Invoice payment", category: "Income", amount: 1250 },
    { id: "txn_puregym", merchant: "PureGym", category: "Health", amount: -34.99 },
    { id: "txn_icloud", merchant: "Apple iCloud", category: "Subscription", amount: -8.99 }
  ],
  habits: [
    { id: "habit_workout", name: "Workout", week: [true, true, true, false, false, false, false] },
    { id: "habit_read", name: "Read", week: [true, true, false, false, false, false, false] },
    { id: "habit_water", name: "Water", week: [true, true, true, true, false, false, false] }
  ],
  connectedAccounts: [
    { id: "conn_icloud", name: "iCloud Calendar", description: "Syncing events and reminders", enabled: true },
    { id: "conn_monzo", name: "Monzo", description: "Balances and recent transactions", enabled: true },
    { id: "conn_starling", name: "Starling", description: "Savings goals and subscriptions", enabled: false }
  ]
};
