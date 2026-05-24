import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useSWR from "swr";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { dashboardFixture } from "@/test/fixtures";

vi.mock("swr", () => ({ default: vi.fn() }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-24T12:00:00.000Z"));
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("DashboardClient", () => {
  it("adds local reminders, previews calendar events and writes habit toggles", () => {
    const data = dashboardFixture();
    data.tasks = [
      {
        id: "today",
        title: "Pay electricity bill",
        urgency: "today",
        key: true,
        priorityScore: 90,
        tags: [],
        dueDate: "2026-05-24"
      }
    ];
    data.calendarEvents = [
      {
        id: "event",
        title: "All hands",
        date: "2026-05-24",
        startTime: "All Day",
        endTime: "",
        allDay: true,
        location: "Office",
        source: "placeholder"
      }
    ];
    data.habits = [
      { id: "parent", name: "Exercise", targetPerWeek: 3, sortOrder: 1, active: true },
      { id: "child-a", name: "Walk", parentHabitId: "parent", targetPerWeek: 3, sortOrder: 1, active: true },
      { id: "child-b", name: "Lift", parentHabitId: "parent", targetPerWeek: 3, sortOrder: 2, active: true },
      { id: "read", name: "Read", targetPerWeek: 5, sortOrder: 2, active: true }
    ];
    data.habitLogs = [{ habitId: "child-a", date: "2026-05-24", completed: true }];
    vi.mocked(useSWR).mockReturnValue({ data } as never);

    const { container } = render(<DashboardClient initialData={data} />);

    expect(screen.getByText("Pay electricity bill")).toBeInTheDocument();
    expect(screen.getByText("Due Sun 24 May")).toBeInTheDocument();
    expect(screen.getAllByText("All Day · Office").length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("Add a new reminder"), { target: { value: "Buy milk" } });
    fireEvent.click(screen.getByRole("button", { name: "Add reminder" }));
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
    expect(screen.getByText("Added locally")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Today" }));

    const readRow = screen.getByText("Read").closest("label");
    fireEvent.click(readRow!.querySelector("input")!);
    const details = container.querySelector("details")!;
    details.open = true;
    fireEvent.click(screen.getByText("Walk").closest("label")!.querySelector("input")!);
    fireEvent.click(screen.getByText("Lift").closest("label")!.querySelector("input")!);
    fireEvent.click(screen.getByText("Walk").closest("label")!.querySelector("input")!);

    expect(fetch).toHaveBeenCalledWith(
      "/api/habits/entries",
      expect.objectContaining({ method: "PUT" })
    );
    expect(screen.getByText(/2\/2 sub-habits/)).toBeInTheDocument();
  });

  it("renders empty reminder, calendar and habit states", () => {
    const data = dashboardFixture();
    data.tasks = [];
    data.calendarEvents = [];
    data.habits = [];
    data.habitLogs = [];
    vi.mocked(useSWR).mockReturnValue({ data: undefined } as never);

    render(<DashboardClient initialData={data} />);

    expect(screen.getByText("No reminders to show.")).toBeInTheDocument();
    expect(screen.getByText("No upcoming calendar events.")).toBeInTheDocument();
    expect(screen.getByText("No habits yet. Add one from Settings.")).toBeInTheDocument();
  });
});
