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

  return calendar
    .getAllSubcomponents("vevent")
    .flatMap((component) => expandEvent(component, startWindow, endWindow))
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
    .slice(0, 50);
}

function expandEvent(component: ICAL.Component, startWindow: Date, endWindow: Date): CalendarEvent[] {
  const event = new ICAL.Event(component);

  if (!event.isRecurring()) {
    const start = event.startDate.toJSDate();
    if (start < startWindow || start >= endWindow) return [];
    return [mapEvent(event, start, event.endDate.toJSDate())];
  }

  const iterator = event.iterator();
  const duration = event.duration;
  const events: CalendarEvent[] = [];
  let next = iterator.next();

  while (next) {
    const start = next.toJSDate();
    if (start >= endWindow) break;
    if (start >= startWindow) {
      const end = next.clone();
      end.addDuration(duration);
      events.push(mapEvent(event, start, end.toJSDate(), next.toString()));
    }
    next = iterator.next();
  }

  return events;
}

function mapEvent(event: ICAL.Event, start: Date, end: Date, recurrenceKey?: string): CalendarEvent {
  const baseId = event.uid || `${event.summary}_${start.toISOString()}`;
  return {
    id: recurrenceKey ? `${baseId}_${recurrenceKey}` : baseId,
    title: event.summary || "Untitled event",
    date: formatDateKey(start),
    startTime: formatTime(start),
    endTime: formatTime(end),
    location: event.location || undefined,
    source: "apple"
  };
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

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}
