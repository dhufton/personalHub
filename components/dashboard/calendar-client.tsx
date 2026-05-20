"use client";

import { useMemo, useState } from "react";
import type { DashboardData } from "@/lib/types";
import { Panel, ScreenHeader } from "@/components/ui/primitives";

export function CalendarClient({ data }: { data: DashboardData }) {
  const [selectedDate, setSelectedDate] = useState(data.calendarEvents[0]?.date ?? localDateKey(new Date()));
  const days = useMemo(() => nextDays(14), []);
  const selectedEvents = data.calendarEvents.filter((event) => event.date === selectedDate);

  return (
    <>
      <ScreenHeader
        title="Calendar"
        copy="Fourteen-day placeholder view. Add a Google iCal URL later to feed this surface."
      />

      <Panel title="Next 14 days" description="Click a day to inspect events.">
        <div className="calendar-strip calendar-strip-wide">
          {days.map((day) => (
            <button
              className={`day-pill${day.key === selectedDate ? " is-today" : ""}`}
              key={day.key}
              type="button"
              onClick={() => setSelectedDate(day.key)}
            >
              <strong>{day.weekday}</strong>
              <span>{day.dayMonth}</span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title={formatLongDate(selectedDate)} description={`${selectedEvents.length} event${selectedEvents.length === 1 ? "" : "s"}.`}>
        <div className="agenda-list">
          {selectedEvents.length ? (
            selectedEvents.map((event) => (
              <div className="agenda-row" key={event.id}>
                <time>{event.startTime}</time>
                <div>
                  <strong>{event.title}</strong>
                  <span>{event.endTime}{event.location ? ` · ${event.location}` : ""}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-state">No placeholder events for this date.</p>
          )}
        </div>
      </Panel>
    </>
  );
}

function nextDays(count: number) {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return {
      key: localDateKey(date),
      weekday: new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "Europe/London" }).format(date),
      dayMonth: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "Europe/London" }).format(date)
    };
  });
}

function localDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London"
  }).format(new Date(`${value}T12:00:00`));
}
