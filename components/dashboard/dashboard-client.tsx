"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetchJson } from "@/lib/fetcher";
import { formatCurrency } from "@/lib/format";
import type { DashboardData, HabitDefinition, HabitLog } from "@/lib/types";
import { ButtonLink, Panel, ScreenHeader } from "@/components/ui/primitives";

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const { data } = useSWR<DashboardData>("/api/dashboard", fetchJson, {
    fallbackData: initialData,
    revalidateOnFocus: false
  });
  const dashboard = data ?? initialData;
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>(dashboard.habitLogs);
  const [localReminders, setLocalReminders] = useState<ReminderPreview[]>([]);
  const [reminderText, setReminderText] = useState("");
  const [toast, setToast] = useState("");

  const reminders = useMemo(() => {
    return [
      ...localReminders,
      ...dashboard.tasks.filter((task) => !task.completedAt).map((task) => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate
      }))
    ]
      .slice(0, 4);
  }, [dashboard.tasks, localReminders]);

  const weekDates = useMemo(() => getWeekDates(), []);
  const todayKey = localDateKey(new Date());
  const calendarPreview = dashboard.calendarEvents.filter((event) => event.date >= todayKey).slice(0, 3);
  const topLevelHabits = useMemo(() => dashboard.habits.filter((habit) => !habit.parentHabitId).sort(compareHabits), [dashboard.habits]);
  const habitMap = useMemo(() => {
    const map = new Map<string, boolean>();
    habitLogs.forEach((log) => map.set(`${log.habitId}_${log.date}`, log.completed));
    return map;
  }, [habitLogs]);

  const completedToday = topLevelHabits.filter((habit) => habitMap.get(`${habit.id}_${todayKey}`)).length;
  const finance = dashboard.financeSnapshot;
  const assets = finance.categories.filter((category) => category.kind === "asset").reduce((sum, category) => sum + category.value, 0);
  const liabilities = finance.categories.filter((category) => category.kind === "liability").reduce((sum, category) => sum + category.value, 0);
  const completionPercent = topLevelHabits.length ? Math.round((completedToday / topLevelHabits.length) * 100) : 0;
  const todayLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: dashboard.profile.timezone
  }).format(new Date());

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }

  function addReminder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = reminderText.trim();
    if (!title) return;

    setLocalReminders((items) => [
      {
        id: `reminder_${Date.now()}`,
        title,
        isLocal: true
      },
      ...items
    ]);
    setReminderText("");
    flash("Reminder added locally");
  }

  function subHabitsFor(parentId: string) {
    return dashboard.habits.filter((habit) => habit.parentHabitId === parentId).sort(compareHabits);
  }

  function isHabitComplete(habitId: string, date: string) {
    return habitMap.get(`${habitId}_${date}`) ?? false;
  }

  function writeHabitLog(habitId: string, date: string, completed: boolean) {
    setHabitLogs((logs) => {
      const key = `${habitId}_${date}`;
      const existing = logs.find((log) => `${log.habitId}_${log.date}` === key);
      if (existing) {
        return logs.map((log) => (`${log.habitId}_${log.date}` === key ? { ...log, completed } : log));
      }
      return [...logs, { habitId, date, completed }];
    });

    void fetch("/api/habits/entries", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ habitId, date, completed })
    });
  }

  function toggleHabit(habitId: string, date: string) {
    writeHabitLog(habitId, date, !isHabitComplete(habitId, date));
  }

  function toggleSubHabit(parentHabit: HabitDefinition, subHabit: HabitDefinition, date: string) {
    const nextCompleted = !isHabitComplete(subHabit.id, date);
    writeHabitLog(subHabit.id, date, nextCompleted);

    if (!nextCompleted) return;

    const subHabits = subHabitsFor(parentHabit.id);
    const allSubHabitsComplete = subHabits.every((item) => item.id === subHabit.id || isHabitComplete(item.id, date));
    if (allSubHabitsComplete && !isHabitComplete(parentHabit.id, date)) {
      writeHabitLog(parentHabit.id, date, true);
    }
  }

  return (
    <>
      <ScreenHeader
        title={`Good afternoon, ${dashboard.profile.name}.`}
        copy="A calm command center for today: reminders, calendar, habits, and money in one readable workspace."
        actions={
          <>
            <ButtonLink href="/login" variant="secondary">Auth</ButtonLink>
            <button className="btn" type="button" onClick={() => flash(todayLabel)}>Today</button>
          </>
        }
      />

      <section className="os-grid">
        <Panel title="Profile" description={todayLabel}>
          <div className="operator-card">
            <span className="avatar operator-avatar">{dashboard.profile.initials}</span>
            <div>
              <strong>{dashboard.profile.name}</strong>
              <span>{dashboard.profile.role}</span>
            </div>
          </div>
          <div className="operator-meta">
            <div><span>Timezone</span><strong>UK · GMT/BST</strong></div>
            <div><span>Currency</span><strong>{dashboard.profile.homeCurrency}</strong></div>
            <div><span>Habits</span><strong>{completionPercent}% today</strong></div>
          </div>
        </Panel>

        <Panel
          title="Today"
          description="Reminders and calendar events at a glance."
          action={<span className="count-pill">{reminders.length} reminder{reminders.length === 1 ? "" : "s"}</span>}
          className="session-panel"
        >
          <form className="command-center" onSubmit={addReminder}>
            <div>
              <span className="panel-kicker">Reminders</span>
              <h3 className="panel-title">What should you remember?</h3>
              <p>New reminders remain local to this dashboard until a supported sync provider is connected.</p>
              <div className="capture-row">
                <input
                  className="capture-input"
                  value={reminderText}
                  onChange={(event) => setReminderText(event.target.value)}
                  placeholder="Add a reminder..."
                  aria-label="Add a new reminder"
                />
                <button className="btn" type="submit">Add reminder</button>
              </div>
            </div>
          </form>
          <div className="session-list" aria-label="Reminder preview">
            {reminders.length ? (
              reminders.map((reminder) => <ReminderRow key={reminder.id} reminder={reminder} />)
            ) : (
              <p className="empty-state">No reminders to show.</p>
            )}
          </div>
          <div className="agenda-list" aria-label="Calendar preview">
            <span className="panel-kicker">Upcoming calendar</span>
            {calendarPreview.length ? (
              calendarPreview.map((event) => (
                <div className="agenda-row" key={event.id}>
                  <time>{formatShortDate(event.date)}</time>
                  <div>
                    <strong>{event.title}</strong>
                    <span>{formatCalendarEventMeta(event)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">No upcoming calendar events.</p>
            )}
          </div>
        </Panel>

        <Panel title="Schedule" description="Today and the next visible commitments." action={<ButtonLink href="/calendar" variant="secondary">Open</ButtonLink>}>
          <div className="agenda-list">
            {dashboard.calendarEvents.slice(0, 4).map((event) => (
              <div className="agenda-row" key={event.id}>
                <time>{formatShortDate(event.date)}</time>
                <div>
                  <strong>{event.title}</strong>
                  <span>{formatCalendarEventMeta(event)}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Habits"
          description={`${completedToday}/${topLevelHabits.length} completed today.`}
          action={<ButtonLink href="/settings#habits" variant="success">+ Add</ButtonLink>}
        >
          <div className="habit-today-list">
            {topLevelHabits.length ? (
              topLevelHabits.map((habit) => {
                const subHabits = subHabitsFor(habit.id);
                const subHabitTotal = subHabits.length || 1;
                const subHabitCompleted = subHabits.length
                  ? subHabits.filter((subHabit) => isHabitComplete(subHabit.id, todayKey)).length
                  : isHabitComplete(habit.id, todayKey)
                    ? 1
                    : 0;
                const completed = isHabitComplete(habit.id, todayKey);

                return (
                  <div className="habit-today-row" key={habit.id}>
                    <label className="habit-checkbox-row">
                      <input
                        type="checkbox"
                        checked={completed}
                        onChange={() => toggleHabit(habit.id, todayKey)}
                      />
                      <span>
                        <strong>{habit.name}</strong>
                        <small>{subHabitCompleted}/{subHabitTotal} sub-habits</small>
                      </span>
                    </label>
                    {subHabits.length ? (
                      <details className="subhabit-details">
                        <summary>Sub-habits</summary>
                        <div className="subhabit-check-list">
                          {subHabits.map((subHabit) => (
                            <label className="subhabit-check-row" key={subHabit.id}>
                              <input
                                type="checkbox"
                                checked={isHabitComplete(subHabit.id, todayKey)}
                                onChange={() => toggleSubHabit(habit, subHabit, todayKey)}
                              />
                              <span>{subHabit.name}</span>
                            </label>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <p className="empty-state">No habits yet. Add one from Settings.</p>
            )}
          </div>
          <div className="habit-week-strip" aria-label="Weekly habit completion">
            {weekDates.map((date) => (
              <div className="week-dot-group" key={date.key}>
                <span>{date.label}</span>
                <strong>{topLevelHabits.filter((habit) => habitMap.get(`${habit.id}_${date.key}`)).length}</strong>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Finance Pulse" description={`Latest ${finance.source === "placeholder" ? "manual-ready" : "sheet"} snapshot.`} action={<ButtonLink href="/finances" variant="secondary">Detail</ButtonLink>}>
          <div className="metric-grid">
            <div className="metric is-good"><span>Net worth</span><strong>{formatCurrency(finance.netWorth, finance.currency)}</strong></div>
            <div className="metric"><span>Assets</span><strong>{formatCurrency(assets, finance.currency)}</strong></div>
            <div className="metric is-warn"><span>Liabilities</span><strong>{formatCurrency(liabilities, finance.currency)}</strong></div>
          </div>
          <div className="finance-categories">
            {finance.categories.map((category) => (
              <div className="mini-row" key={category.id}>
                <div><strong>{category.name}</strong><span>{category.kind}</span></div>
                <span>{formatCurrency(category.value, finance.currency)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Toast message={toast} />
    </>
  );
}

type ReminderPreview = {
  id: string;
  title: string;
  dueDate?: string;
  isLocal?: boolean;
};

function ReminderRow({ reminder }: { reminder: ReminderPreview }) {
  return (
    <div className="list-row">
      <span className="status-dot" aria-hidden="true" />
      <div>
        <strong>{reminder.title}</strong>
        <span>{formatReminderMeta(reminder)}</span>
      </div>
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return <div className={`toast${message ? " is-visible" : ""}`}>{message}</div>;
}

function localDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function getWeekDates() {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() + mondayOffset + index);
    return {
      key: localDateKey(date),
      label: new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "Europe/London" }).format(date)
    };
  });
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "Europe/London"
  }).format(new Date(`${value}T12:00:00`));
}

function formatCalendarEventMeta(event: DashboardData["calendarEvents"][number]) {
  if (event.allDay) {
    return `All Day${event.location ? ` · ${event.location}` : ""}`;
  }

  return `${event.startTime} - ${event.endTime}${event.location ? ` · ${event.location}` : ""}`;
}

function formatReminderMeta(reminder: ReminderPreview) {
  if (reminder.isLocal) return "Added locally";
  if (reminder.dueDate) return `Due ${formatShortDate(reminder.dueDate)}`;
  return "Reminder";
}

function compareHabits(a: HabitDefinition, b: HabitDefinition) {
  return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
}
