"use client";

import { useMemo, useState } from "react";
import type { DashboardData } from "@/lib/types";
import { Panel, ScreenHeader } from "@/components/ui/primitives";

export function CalendarClient({ data }: { data: DashboardData }) {
  const todayKey = localDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const days = useMemo(() => nextDays(14), []);
  const selectedEvents = data.calendarEvents.filter((event) => event.date === selectedDate);
  const upcomingEvents = data.calendarEvents.filter((event) => event.date >= todayKey).slice(0, 5);

  return (
    <>
      <ScreenHeader
        title="Calendar"
        copy="A clean two-week agenda with Apple Calendar-style scanning and focused daily context."
        actions={<button className="btn secondary" type="button" onClick={() => setSelectedDate(todayKey)}>Today</button>}
      />

      <section className="calendar-layout">
        <Panel title="Next 14 days" description="Click a day to inspect events." className="calendar-strip-panel">
          <div className="calendar-strip calendar-strip-wide">
            {days.map((day) => {
              const eventCount = data.calendarEvents.filter((event) => event.date === day.key).length;
              return (
                <button
                  className={`day-pill${day.key === selectedDate ? " is-selected" : ""}`}
                  key={day.key}
                  type="button"
                  onClick={() => setSelectedDate(day.key)}
                >
                  <strong>{day.weekday}</strong>
                  <span>{day.dayMonth}</span>
                  <small>{eventCount ? `${eventCount} event${eventCount === 1 ? "" : "s"}` : "Open"}</small>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title={formatLongDate(selectedDate)} description={`${selectedEvents.length} event${selectedEvents.length === 1 ? "" : "s"}.`} className="day-agenda-panel">
          <div className="calendar-day-detail">
            <div className="agenda-list">
              {selectedEvents.length ? (
                selectedEvents.map((event) => (
                  <div className="agenda-row" key={event.id}>
                    <time>{event.allDay ? "All Day" : event.startTime}</time>
                    <div className="agenda-event">
                      <strong>{event.title}</strong>
                      <span>
                        {formatEventMeta(event)}
                        <span className={`source-pill ${event.source}`}>{event.source}</span>
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">No events for this date.</p>
              )}
            </div>
            <aside className="calendar-summary">
              <span className="panel-kicker">Selected day</span>
              <strong>{selectedEvents.length}</strong>
              <p>{selectedEvents.length === 1 ? "scheduled commitment" : "scheduled commitments"}</p>
            </aside>
          </div>
        </Panel>

        <Panel title="Upcoming" description="The next visible commitments." className="upcoming-panel">
          <div className="list">
            {upcomingEvents.length ? (
              upcomingEvents.map((event) => (
                <button className="list-row event-button" key={event.id} type="button" onClick={() => setSelectedDate(event.date)}>
                  <div>
                    <strong>{event.title}</strong>
                    <span>{formatLongDate(event.date)} · {formatEventMeta(event)}</span>
                  </div>
                  <span className={`source-pill ${event.source}`}>{event.source}</span>
                </button>
              ))
            ) : (
              <p className="empty-state">No upcoming events in the current sample data.</p>
            )}
          </div>
        </Panel>
      </section>
    </>
  );
}

function formatEventMeta(event: DashboardData["calendarEvents"][number]) {
  const parts = [];
  if (!event.allDay && event.endTime) {
    parts.push(event.endTime);
  }
  if (event.location) {
    parts.push(event.location);
  }
  return parts.join(" · ") || (event.allDay ? "All day event" : "Scheduled event");
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
