import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAppleCalendarEvents, parseAppleCalendarEvents } from "@/lib/integrations/apple-calendar";

const calendarFeed = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:planning
DTSTART:20260525T090000Z
DTEND:20260525T100000Z
SUMMARY:Planning
LOCATION:Studio
END:VEVENT
BEGIN:VEVENT
UID:leave
DTSTART;VALUE=DATE:20260524
DTEND;VALUE=DATE:20260526
SUMMARY:Leave
END:VEVENT
BEGIN:VEVENT
UID:standup
DTSTART:20260524T080000Z
DTEND:20260524T083000Z
RRULE:FREQ=DAILY;COUNT=3
SUMMARY:Standup
END:VEVENT
END:VCALENDAR`;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-24T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("parseAppleCalendarEvents", () => {
  it("expands recurring and multi-day events within the requested window in display order", () => {
    const events = parseAppleCalendarEvents(calendarFeed, 2);

    expect(events.map(({ title, date, startTime, allDay }) => ({ title, date, startTime, allDay }))).toEqual([
      { title: "Leave", date: "2026-05-24", startTime: "All Day", allDay: true },
      { title: "Standup", date: "2026-05-24", startTime: "09:00", allDay: false },
      { title: "Leave", date: "2026-05-25", startTime: "All Day", allDay: true },
      { title: "Standup", date: "2026-05-25", startTime: "09:00", allDay: false },
      { title: "Planning", date: "2026-05-25", startTime: "10:00", allDay: false }
    ]);
  });

  it("expands recurring all-day events within the visible range", () => {
    const recurringAllDayFeed = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:holiday
DTSTART;VALUE=DATE:20260523
DTEND;VALUE=DATE:20260524
RRULE:FREQ=DAILY;COUNT=3
SUMMARY:Holiday
END:VEVENT
END:VCALENDAR`;

    const events = parseAppleCalendarEvents(recurringAllDayFeed, 2);

    expect(events.map((event) => event.date)).toEqual(["2026-05-24", "2026-05-25"]);
    expect(events.every((event) => event.allDay)).toBe(true);
  });
});

describe("fetchAppleCalendarEvents", () => {
  it("requests an iCalendar feed with revalidation and parses its events", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(calendarFeed)
    });
    vi.stubGlobal("fetch", fetchMock);

    const events = await fetchAppleCalendarEvents("https://calendar.example/feed.ics", 1);

    expect(fetchMock).toHaveBeenCalledWith("https://calendar.example/feed.ics", {
      headers: { accept: "text/calendar,text/plain,*/*" },
      next: { revalidate: 300 }
    });
    expect(events.map((event) => event.title)).toEqual(["Leave", "Standup"]);
  });

  it("surfaces feed failures using the returned status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    await expect(fetchAppleCalendarEvents("https://calendar.example/missing.ics")).rejects.toThrow(
      "Apple Calendar feed returned 404"
    );
  });
});
