import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsClient } from "@/components/dashboard/settings-client";
import { dashboardFixture } from "@/test/fixtures";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function renderSettings() {
  const data = dashboardFixture();
  return render(
    <SettingsClient profile={data.profile} connectedAccounts={data.connectedAccounts} habits={data.habits} />
  );
}

describe("SettingsClient", () => {
  it("adds a habit and normalized sub-habits from the manager form", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          habit: { id: "run", name: "Run", targetPerWeek: 3, sortOrder: 8, active: true },
          subHabits: [{ id: "stretch", name: "Stretch", parentHabitId: "run", targetPerWeek: 3, sortOrder: 1, active: true }]
        })
      })
    );
    renderSettings();

    fireEvent.change(screen.getByLabelText("Habit name"), { target: { value: "Run" } });
    fireEvent.change(screen.getByLabelText("Target days"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Sub-habits"), { target: { value: " Stretch,  Cool   down " } });
    fireEvent.click(screen.getByRole("button", { name: "Add habit" }));

    await waitFor(() => expect(screen.getByText("Run added.")).toBeInTheDocument());
    expect(screen.getByText("Run")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/habits",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Run", targetPerWeek: 3, subHabits: ["Stretch", "Cool down"] })
      })
    );
  });

  it("adds and removes sub-habits while surfacing failed deletion", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            habit: { id: "new-child", name: "Swim", parentHabitId: "habit_train", targetPerWeek: 4, sortOrder: 4, active: true }
          })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: vi.fn().mockResolvedValue({ error: "Delete failed" })
        })
    );
    renderSettings();

    fireEvent.change(screen.getByPlaceholderText("Add a sub-habit to Exercise"), { target: { value: "Swim" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Add sub-habit" })[0]);
    await waitFor(() => expect(screen.getByText("Swim added.")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Remove Swim" }));
    await waitFor(() => expect(screen.getByText("Delete failed")).toBeInTheDocument());
  });

  it("validates, creates, updates and removes Apple Calendar feeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ id: "new-calendar" }) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) });
    vi.stubGlobal("fetch", fetchMock);
    renderSettings();

    fireEvent.change(screen.getByLabelText("iCloud calendar URL"), { target: { value: "ftp://not-supported" } });
    fireEvent.click(screen.getByRole("button", { name: "Add calendar" }));
    expect(screen.getByText("Use a public iCloud webcal:// or https:// calendar URL.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Calendar name"), { target: { value: "Family" } });
    fireEvent.change(screen.getByLabelText("iCloud calendar URL"), {
      target: { value: "webcal://p01-caldav.icloud.com/family.ics" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Purple calendar colour" }));
    fireEvent.click(screen.getByRole("button", { name: "Add calendar" }));
    await waitFor(() => expect(screen.getByText("Family saved for this user.")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Disable Family" }));
    await waitFor(() => expect(screen.getByText("Family updated.")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Delete Family" }));
    await waitFor(() => expect(screen.getByText("Family removed.")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("toggles non-calendar account controls locally", () => {
    renderSettings();

    const toggle = screen.getByRole("button", { name: "Toggle Manual finance" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("reports failed mutations and exercises calendar editing controls", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: false, json: vi.fn().mockResolvedValue({}) })
        .mockResolvedValueOnce({ ok: false, json: vi.fn().mockResolvedValue({ error: "Sub-habit failed" }) })
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: false, json: vi.fn().mockResolvedValue({ error: "Update failed" }) })
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: false, json: vi.fn().mockResolvedValue({ error: "Delete calendar failed" }) })
        .mockResolvedValueOnce({ ok: false, json: vi.fn().mockResolvedValue({ error: "Save calendar failed" }) })
    );
    const { container } = renderSettings();

    fireEvent.change(screen.getByLabelText("Habit name"), { target: { value: "Write" } });
    fireEvent.click(screen.getByRole("button", { name: "Add habit" }));
    await waitFor(() => expect(screen.getByText("Could not save habit.")).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("Add a sub-habit to Exercise"), { target: { value: "Run" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Add sub-habit" })[0]);
    await waitFor(() => expect(screen.getByText("Sub-habit failed")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Remove Read" }));
    await waitFor(() => expect(screen.getByText("Read removed.")).toBeInTheDocument());

    const calendarName = container.querySelector(".calendar-name-input") as HTMLInputElement;
    fireEvent.change(calendarName, { target: { value: "Edited" } });
    fireEvent.blur(calendarName);
    await waitFor(() => expect(screen.getByText("Update failed")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Set Edited colour to Purple" }));
    await waitFor(() => expect(screen.getByText("Edited updated.")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Delete Edited" }));
    await waitFor(() => expect(screen.getByText("Delete calendar failed")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("iCloud calendar URL"), { target: { value: "https://icloud.com/new" } });
    fireEvent.click(screen.getByRole("button", { name: "Add calendar" }));
    await waitFor(() => expect(screen.getByText("Save calendar failed")).toBeInTheDocument());
  });
});
