"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetchJson } from "@/lib/fetcher";
import { formatCurrency } from "@/lib/format";
import type { DashboardData, HabitLog, Task } from "@/lib/types";
import { ButtonLink, Panel, ScreenHeader } from "@/components/ui/primitives";

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const { data } = useSWR<DashboardData>("/api/dashboard", fetchJson, {
    fallbackData: initialData,
    revalidateOnFocus: false
  });
  const dashboard = data ?? initialData;
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>(dashboard.habitLogs);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");

  const sessionTasks = useMemo(() => {
    return dashboard.tasks
      .filter((task) => task.urgency === "today" && task.key && !completedTasks.has(task.id))
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 3);
  }, [completedTasks, dashboard.tasks]);

  const weekDates = useMemo(() => getWeekDates(), []);
  const habitMap = useMemo(() => {
    const map = new Map<string, boolean>();
    habitLogs.forEach((log) => map.set(`${log.habitId}_${log.date}`, log.completed));
    return map;
  }, [habitLogs]);

  const completedToday = dashboard.habits.filter((habit) => habitMap.get(`${habit.id}_${localDateKey(new Date())}`)).length;
  const finance = dashboard.financeSnapshot;
  const assets = finance.categories.filter((category) => category.kind === "asset").reduce((sum, category) => sum + category.value, 0);
  const liabilities = finance.categories.filter((category) => category.kind === "liability").reduce((sum, category) => sum + category.value, 0);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
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

  function toggleHabit(habitId: string, date: string) {
    setHabitLogs((logs) => {
      const key = `${habitId}_${date}`;
      const existing = logs.find((log) => `${log.habitId}_${log.date}` === key);
      if (existing) {
        return logs.map((log) => (`${log.habitId}_${log.date}` === key ? { ...log, completed: !log.completed } : log));
      }
      return [...logs, { habitId, date, completed: true }];
    });
  }

  return (
    <>
      <ScreenHeader
        title="Personal OS"
        copy="A focused home for the day: operator context, session priorities, calendar, habits, and finance."
        actions={
          <>
            <ButtonLink href="/login" variant="secondary">Auth</ButtonLink>
            <button className="btn" type="button" onClick={() => flash("Placeholder mode active")}>Demo mode</button>
          </>
        }
      />

      <section className="os-grid">
        <Panel title="Operator" description="Single-user control profile.">
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
            <div><span>Auth</span><strong>Supabase-ready</strong></div>
          </div>
        </Panel>

        <Panel title="Session" description="Top key tasks for today." action={<span className="count-pill">{sessionTasks.length} active</span>}>
          <div className="list">
            {sessionTasks.length ? (
              sessionTasks.map((task) => <SessionTask key={task.id} task={task} onDone={() => toggleTask(task.id)} />)
            ) : (
              <p className="empty-state">No key tasks left for today.</p>
            )}
          </div>
        </Panel>

        <Panel title="Calendar" description="Placeholder schedule until Apple Calendar is connected." action={<ButtonLink href="/calendar" variant="secondary">Open</ButtonLink>}>
          <div className="agenda-list">
            {dashboard.calendarEvents.slice(0, 4).map((event) => (
              <div className="agenda-row" key={event.id}>
                <time>{formatShortDate(event.date)}</time>
                <div>
                  <strong>{event.title}</strong>
                  <span>{event.startTime} - {event.endTime}{event.location ? ` · ${event.location}` : ""}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Habits" description={`${completedToday}/${dashboard.habits.length} completed today.`}>
          <div className="habit-grid">
            {dashboard.habits.map((habit) => (
              <div className="habit-row" key={habit.id}>
                <strong>{habit.name}</strong>
                {weekDates.map((date) => (
                  <button
                    aria-label={`${habit.name} ${date.label}`}
                    className={`dot${habitMap.get(`${habit.id}_${date.key}`) ? " is-on" : ""}`}
                    key={date.key}
                    type="button"
                    onClick={() => toggleHabit(habit.id, date.key)}
                  />
                ))}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Finance Pulse" description={`Latest ${finance.source === "placeholder" ? "placeholder" : "sheet"} snapshot.`} action={<ButtonLink href="/finances" variant="secondary">Detail</ButtonLink>}>
          <div className="metric-grid">
            <div className="metric"><span>Net worth</span><strong>{formatCurrency(finance.netWorth, finance.currency)}</strong></div>
            <div className="metric"><span>Assets</span><strong>{formatCurrency(assets, finance.currency)}</strong></div>
            <div className="metric"><span>Liabilities</span><strong>{formatCurrency(liabilities, finance.currency)}</strong></div>
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
