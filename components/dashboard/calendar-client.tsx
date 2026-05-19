"use client";

import { useMemo, useState } from "react";
import type { DashboardData } from "@/lib/types";
import { Panel, ScreenHeader } from "@/components/ui/primitives";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
const hours = [8, 9, 10, 11, 12, 13, 14, 15];

export function CalendarClient({ data }: { data: DashboardData }) {
  const [view, setView] = useState<"week" | "month">("week");
  const eventsByDayHour = useMemo(() => {
    const map = new Map<string, string>();
    data.calendarEvents.forEach((event) => {
      for (let hour = event.startHour; hour < event.startHour + event.durationHours; hour += 1) {
        map.set(`${event.day}_${hour}`, hour === event.startHour ? event.title : event.title);
      }
    });
    return map;
  }, [data.calendarEvents]);

  const monthEventsByDay = useMemo(() => {
    const map = new Map<number, string[]>();
    data.monthEvents.forEach((event) => {
      const day = Number(event.date.slice(-2));
      map.set(day, [...(map.get(day) ?? []), event.label]);
    });
    return map;
  }, [data.monthEvents]);

  return (
    <>
      <ScreenHeader
        title="Calendar"
        copy="Week planner for action, month overview for context."
        actions={
          <div className="segmented" aria-label="Calendar view">
            <button className={view === "week" ? "is-active" : ""} type="button" onClick={() => setView("week")}>Week</button>
            <button className={view === "month" ? "is-active" : ""} type="button" onClick={() => setView("month")}>Month</button>
          </div>
        }
      />

      {view === "week" ? (
        <Panel title="Week of 19 May" description="Focus blocks stay visible around fixed commitments." action={<button className="btn secondary" type="button">Export</button>}>
          <div className="week-board">
            <div className="time-col">
              {hours.map((hour) => <span className="time-slot" key={hour}>{String(hour).padStart(2, "0")}:00</span>)}
            </div>
            {days.map((day) => (
              <div className="week-col" key={day}>
                {hours.map((hour, index) => {
                  const label = index === 0 ? day : eventsByDayHour.get(`${day}_${hour}`);
                  return <div className={`week-block${label && label !== day ? " busy" : ""}`} key={`${day}_${hour}`}>{label}</div>;
                })}
              </div>
            ))}
          </div>
        </Panel>
      ) : (
        <Panel title="May 2026" description="Key dates and recurring personal events." action={<button className="btn secondary" type="button">Print</button>}>
          <div className="calendar-grid">
            {Array.from({ length: 28 }, (_, index) => index + 1).map((day) => (
              <div className="month-cell" key={day}>
                <time>{day} {["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"][(day - 1) % 7]}</time>
                {(monthEventsByDay.get(day) ?? []).map((label) => <span className="event-chip" key={label}>{label}</span>)}
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
