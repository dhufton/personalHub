import ICAL from "ical.js";
import type { CalendarEvent } from "@/lib/types";

export async function fetchAppleCalendarEvents(icalUrl: string, windowDays = 14): Promise<CalendarEvent[]> {
  const response = await fetch(icalUrl, {
    headers: {
      accept: "text/calendar,text/plain,*/*"
    },
    next: {
      revalidate: 300
    }
  });

  if (!response.ok) {
    throw new Error(`Apple Calendar feed returned ${response.status}`);
  }

  const body = await response.text();
  return parseAppleCalendarEvents(body, windowDays);
}

export function parseAppleCalendarEvents(body: string, windowDays = 14): CalendarEvent[] {
  const calendar = new ICAL.Component(ICAL.parse(body));
  const startWindow = startOfDay(new Date());
  const endWindow = new Date(startWindow);
  endWindow.setDate(startWindow.getDate() + windowDays);
  const startWindowKey = formatDateKey(startWindow);
  const endWindowKey = formatDateKey(endWindow);

  return calendar
    .getAllSubcomponents("vevent")
    .flatMap((component) => expandEvent(component, startWindow, endWindow, startWindowKey, endWindowKey))
    .sort(compareEvents)
    .slice(0, 50);
}

function expandEvent(
  component: ICAL.Component,
  startWindow: Date,
  endWindow: Date,
  startWindowKey: string,
  endWindowKey: string
): CalendarEvent[] {
  const event = new ICAL.Event(component);
  const isAllDay = event.startDate.isDate;

  if (!event.isRecurring()) {
    if (isAllDay) {
      return mapAllDayEvent(event, event.startDate, event.endDate, startWindowKey, endWindowKey);
    }

    const start = event.startDate.toJSDate();
    if (start < startWindow || start >= endWindow) return [];
    return [mapTimedEvent(event, start, event.endDate.toJSDate())];
  }

  const iterator = event.iterator();
  const duration = event.duration;
  const events: CalendarEvent[] = [];
  let next = iterator.next();

  while (next) {
    if (isAllDay) {
      const startKey = timeDateKey(next);
      if (startKey >= endWindowKey) break;
      const end = next.clone();
      end.addDuration(duration);
      events.push(...mapAllDayEvent(event, next, end, startWindowKey, endWindowKey, next.toString()));
      next = iterator.next();
      continue;
    }

    const start = next.toJSDate();
    if (start >= endWindow) break;
    if (start >= startWindow) {
      const end = next.clone();
      end.addDuration(duration);
      events.push(mapTimedEvent(event, start, end.toJSDate(), next.toString()));
    }
    next = iterator.next();
  }

  return events;
}

function mapAllDayEvent(
  event: ICAL.Event,
  start: ICAL.Time,
  end: ICAL.Time,
  startWindowKey: string,
  endWindowKey: string,
  recurrenceKey?: string
): CalendarEvent[] {
  const baseId = event.uid || `${event.summary}_${timeDateKey(start)}`;
  const firstDate = maxDateKey(timeDateKey(start), startWindowKey);
  const endDate = minDateKey(timeDateKey(end), endWindowKey);
  const events: CalendarEvent[] = [];
  let date = firstDate;

  while (date < endDate) {
    events.push({
      id: `${recurrenceKey ?? baseId}_${date}`,
      title: event.summary || "Untitled event",
      date,
      startTime: "All Day",
      endTime: "",
      allDay: true,
      location: event.location || undefined,
      source: "apple"
    });
    date = addDaysToDateKey(date, 1);
  }

  return events;
}

function mapTimedEvent(event: ICAL.Event, start: Date, end: Date, recurrenceKey?: string): CalendarEvent {
  const baseId = event.uid || `${event.summary}_${start.toISOString()}`;
  return {
    id: recurrenceKey ? `${baseId}_${recurrenceKey}` : baseId,
    title: event.summary || "Untitled event",
    date: formatDateKey(start),
    startTime: formatTime(start),
    endTime: formatTime(end),
    allDay: false,
    location: event.location || undefined,
    source: "apple"
  };
}

function compareEvents(a: CalendarEvent, b: CalendarEvent) {
  const dateCompare = a.date.localeCompare(b.date);
  if (dateCompare !== 0) return dateCompare;
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
  return a.startTime.localeCompare(b.startTime);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function timeDateKey(time: ICAL.Time) {
  return `${time.year}-${String(time.month).padStart(2, "0")}-${String(time.day).padStart(2, "0")}`;
}

function addDaysToDateKey(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function maxDateKey(a: string, b: string) {
  return a > b ? a : b;
}

function minDateKey(a: string, b: string) {
  return a < b ? a : b;
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}
