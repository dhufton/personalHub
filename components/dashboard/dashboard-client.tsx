"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetchJson } from "@/lib/fetcher";
import { formatCurrency, percentage } from "@/lib/format";
import type { DashboardData, Habit, Reminder } from "@/lib/types";
import { ButtonLink, Panel, ScreenHeader } from "@/components/ui/primitives";

const trendHeights = [44, 62, 38, 78, 52, 67];

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const { data } = useSWR<DashboardData>("/api/dashboard", fetchJson, {
    fallbackData: initialData,
    revalidateOnFocus: false
  });
  const dashboard = data ?? initialData;
  const [reminders, setReminders] = useState<Reminder[]>(dashboard.reminders);
  const [habits, setHabits] = useState<Habit[]>(dashboard.habits);
  const [newReminder, setNewReminder] = useState("");
  const [toast, setToast] = useState("");

  const availableBalance = dashboard.accounts.find((account) => account.kind === "current")?.balance ?? 0;
  const savingsGoal = dashboard.savingsGoals[0];
  const remainingBills = dashboard.bills.reduce((total, bill) => total + bill.amount, 0);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }

  function addReminder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newReminder.trim();
    if (!title) return;

    setReminders((items) => [
      { id: `local_${Date.now()}`, title, dueLabel: "Added just now", category: "Today", completed: false },
      ...items
    ]);
    setNewReminder("");
    flash("Reminder added");
  }

  function toggleReminder(id: string) {
    setReminders((items) => items.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)));
  }

  function toggleHabit(habitId: string, dayIndex: number) {
    setHabits((items) =>
      items.map((habit) =>
        habit.id === habitId
          ? { ...habit, week: habit.week.map((value, index) => (index === dayIndex ? !value : value)) }
          : habit
      )
    );
  }

  return (
    <>
      <ScreenHeader
        title="Today"
        copy="Tuesday, 19 May. A balanced read of tasks, plans, money, and habits."
        actions={
          <>
            <button className="btn secondary" type="button" onClick={() => flash("Focus mode queued")}>Focus</button>
            <button className="btn" type="button" onClick={() => flash("Day reviewed")}>Review day</button>
          </>
        }
      />

      <section className="dashboard-grid">
        <div className="stack">
          <Panel title="Reminders" description={`${reminders.length} items, ${reminders.filter((item) => !item.completed).length} open.`} action={<button className="btn secondary" type="button">All</button>}>
            <form className="todo-form" onSubmit={addReminder}>
              <input
                className="field-input"
                type="text"
                placeholder="Add a reminder"
                value={newReminder}
                onChange={(event) => setNewReminder(event.target.value)}
              />
              <button className="btn" type="submit">Add</button>
            </form>
            <div className="list">
              {reminders.map((reminder) => (
                <div className={`list-row${reminder.completed ? " is-done" : ""}`} key={reminder.id}>
                  <button className="check" type="button" aria-label="Toggle reminder" onClick={() => toggleReminder(reminder.id)} />
                  <div>
                    <strong>{reminder.title}</strong>
                    <span>{reminder.dueLabel}</span>
                  </div>
                  <span>{reminder.category}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="This week" description="Planner preview with month context on the detail page." action={<ButtonLink href="/calendar" variant="secondary">Open</ButtonLink>}>
            <div className="calendar-strip">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div className={`day-pill${day === "Tue" ? " is-today" : ""}`} key={day}>
                  <strong>{day}</strong>
                  <span>{day === "Tue" ? "3 events" : day === "Wed" ? "Focus" : day === "Sat" ? "Open" : "Planned"}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="stack">
          <Panel title="Finances" description="Cashflow after recurring costs." action={<ButtonLink href="/finances" variant="secondary">Detail</ButtonLink>}>
            <div className="metric-grid">
              <div className="metric"><span>Available</span><strong>{formatCurrency(availableBalance)}</strong></div>
              <div className="metric"><span>Savings</span><strong>{percentage(savingsGoal.current, savingsGoal.target)}%</strong></div>
              <div className="metric"><span>Bills left</span><strong>{formatCurrency(remainingBills)}</strong></div>
            </div>
            <div className="finance-chart" aria-label="Spending trend">
              {trendHeights.map((height) => <span className="bar" style={{ height: `${height}%` }} key={height} />)}
            </div>
          </Panel>

          <Panel title="Habits" description="Tap a circle to update the week." action={<button className="btn secondary" type="button" onClick={() => flash("Habit summary copied")}>Share</button>}>
            <div className="habit-grid">
              {habits.map((habit) => (
                <div className="habit-row" key={habit.id}>
                  <strong>{habit.name}</strong>
                  {habit.week.map((isOn, index) => (
                    <button
                      aria-label={`${habit.name} day ${index + 1}`}
                      className={`dot${isOn ? " is-on" : ""}`}
                      key={`${habit.id}_${index}`}
                      type="button"
                      onClick={() => toggleHabit(habit.id, index)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>

      <Toast message={toast} />
    </>
  );
}

function Toast({ message }: { message: string }) {
  return <div className={`toast${message ? " is-visible" : ""}`}>{message}</div>;
}
