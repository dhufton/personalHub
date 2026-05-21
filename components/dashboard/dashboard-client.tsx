"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { fetchJson } from "@/lib/fetcher";
import { formatCurrency } from "@/lib/format";
import type { DashboardData, HabitDefinition, HabitLog, Task } from "@/lib/types";
import { ButtonLink, Panel, ScreenHeader } from "@/components/ui/primitives";

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const { data } = useSWR<DashboardData>("/api/dashboard", fetchJson, {
    fallbackData: initialData,
    revalidateOnFocus: false
  });
  const dashboard = data ?? initialData;
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>(dashboard.habitLogs);
  const [capturedTasks, setCapturedTasks] = useState<Task[]>([]);
  const [captureText, setCaptureText] = useState("");
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");
  const [currentTime, setCurrentTime] = useState("--:--");

  const sessionTasks = useMemo(() => {
    return [...capturedTasks, ...dashboard.tasks]
      .filter((task) => task.urgency === "today" && task.key && !completedTasks.has(task.id))
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 4);
  }, [capturedTasks, completedTasks, dashboard.tasks]);

  const weekDates = useMemo(() => getWeekDates(), []);
  const todayKey = localDateKey(new Date());
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

  useEffect(() => {
    function syncClock() {
      setCurrentTime(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: dashboard.profile.timezone }).format(new Date()));
    }

    syncClock();
    const interval = window.setInterval(syncClock, 60_000);
    return () => window.clearInterval(interval);
  }, [dashboard.profile.timezone]);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }

  function captureTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = captureText.trim();
    if (!title) return;

    setCapturedTasks((items) => [
      {
        id: `capture_${Date.now()}`,
        title,
        urgency: "today",
        key: true,
        priorityScore: 82,
        timeEstimateMin: 20,
        tags: ["capture"]
      },
      ...items
    ]);
    setCaptureText("");
    flash("Added to today's session");
  }

  function toggleTask(taskId: string) {
    setCompletedTasks((items) => {
      const next = new Set(items);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
    flash("Session updated locally");
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
        copy="A calm command center for today: priorities, calendar, habits, and money in one readable workspace."
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

        <Panel title="Today" description="Capture one thing, then work the highest-scoring tasks." action={<span className="count-pill">{sessionTasks.length} active</span>} className="session-panel">
          <form className="command-center" onSubmit={captureTask}>
            <div>
              <span className="panel-kicker">Focus prompt</span>
              <h3 className="panel-title">What needs capturing before it gets lost?</h3>
              <p>Use this as the inbox entry point for tasks, meeting notes, money context, and reminders.</p>
              <div className="capture-row">
                <input
                  className="capture-input"
                  value={captureText}
                  onChange={(event) => setCaptureText(event.target.value)}
                  placeholder="Add a priority, note, or reminder..."
                  aria-label="Capture a priority for today"
                />
                <button className="btn" type="submit">Capture</button>
              </div>
            </div>
            <div className="hero-clock">{currentTime}</div>
          </form>
          <div className="session-list">
            {sessionTasks.length ? (
              sessionTasks.map((task) => <SessionTask key={task.id} task={task} onDone={() => toggleTask(task.id)} />)
            ) : (
              <p className="empty-state">No key tasks left for today.</p>
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

function SessionTask({ task, onDone }: { task: Task; onDone: () => void }) {
  return (
    <div className="list-row">
      <button className="check" type="button" aria-label={`Complete ${task.title}`} onClick={onDone} />
      <div>
        <strong>{task.title}</strong>
        <span>{task.timeEstimateMin ? `${task.timeEstimateMin} min` : "Unestimated"} · score {task.priorityScore}</span>
      </div>
      <span>{task.tags[0] ?? "task"}</span>
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

function compareHabits(a: HabitDefinition, b: HabitDefinition) {
  return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
}
