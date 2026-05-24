import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarClient } from "@/components/dashboard/calendar-client";
import { dashboardFixture } from "@/test/fixtures";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-24T12:00:00.000Z"));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("CalendarClient", () => {
  it("renders today's commitments and navigates to an upcoming selected day", () => {
    const data = dashboardFixture();
    data.calendarEvents = [
      {
        id: "all-day",
        title: "Holiday",
        date: "2026-05-24",
        startTime: "All Day",
        endTime: "",
        allDay: true,
        source: "apple"
      },
      {
        id: "tomorrow",
        title: "Review",
        date: "2026-05-25",
        startTime: "10:00",
        endTime: "10:30",
        location: "Desk",
        source: "placeholder"
      }
    ];

    const { container } = render(<CalendarClient data={data} />);

    expect(screen.getAllByText("Holiday")).toHaveLength(2);
    expect(screen.getAllByText("All day event").length).toBeGreaterThan(0);
    fireEvent.click(container.querySelectorAll(".day-pill")[1]);
    expect(screen.getByText("10:30 · Desk")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Review/ }));
    expect(screen.getAllByText("Review").length).toBeGreaterThan(0);
    expect(screen.getByText("10:30 · Desk")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(screen.getAllByText("Holiday")).toHaveLength(2);
  });

  it("shows empty-state messages when no dates have events", () => {
    const data = dashboardFixture();
    data.calendarEvents = [];

    render(<CalendarClient data={data} />);

    expect(screen.getByText("No events for this date.")).toBeInTheDocument();
    expect(screen.getByText("No upcoming events in the current sample data.")).toBeInTheDocument();
  });
});
