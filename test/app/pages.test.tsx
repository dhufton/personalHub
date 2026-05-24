import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CalendarPage from "@/app/calendar/page";
import DashboardPage from "@/app/dashboard/page";
import FinancesPage from "@/app/finances/page";
import RootLayout, { metadata } from "@/app/layout";
import LoginPage from "@/app/login/page";
import HomePage from "@/app/page";
import SettingsPage from "@/app/settings/page";
import { getDashboardData } from "@/lib/dashboard-service";
import { dashboardFixture } from "@/test/fixtures";
import { redirect } from "next/navigation";

vi.mock("@/lib/dashboard-service", () => ({ getDashboardData: vi.fn() }));
vi.mock("@/components/dashboard/dashboard-client", () => ({
  DashboardClient: () => <p>Dashboard client content</p>
}));
vi.mock("@/components/dashboard/calendar-client", () => ({
  CalendarClient: () => <p>Calendar client content</p>
}));
vi.mock("@/components/dashboard/settings-client", () => ({
  SettingsClient: () => <p>Settings client content</p>
}));
vi.mock("@/app/login/login-client", () => ({
  LoginClient: () => <p>Login client content</p>
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn()
}));

beforeEach(() => {
  vi.mocked(getDashboardData).mockResolvedValue(dashboardFixture());
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("application pages", () => {
  it("renders the dashboard, calendar and settings service-backed pages", async () => {
    const dashboard = render(await DashboardPage());
    expect(screen.getByText("Dashboard client content")).toBeInTheDocument();
    dashboard.unmount();

    const calendar = render(await CalendarPage());
    expect(screen.getByText("Calendar client content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add calendar" })).toHaveAttribute("href", "/settings#apple-calendars");
    calendar.unmount();

    render(await SettingsPage());
    expect(screen.getByText("Settings client content")).toBeInTheDocument();
    expect(getDashboardData).toHaveBeenCalledTimes(3);
  });

  it("calculates and renders the finance snapshot surface", async () => {
    render(await FinancesPage());

    expect(screen.getByRole("heading", { name: "Finance" })).toBeInTheDocument();
    expect(screen.getByText("£17,076")).toBeInTheDocument();
    expect(screen.getByText("45.5x")).toBeInTheDocument();
    expect(screen.getByLabelText("Category value chart")).toBeInTheDocument();
  });

  it("renders login and root layout metadata and redirects the home entry point", () => {
    render(<LoginPage />);
    expect(screen.getByText("Login client content")).toBeInTheDocument();

    const layout = RootLayout({ children: <p>Child</p> });
    expect(layout.type).toBe("html");
    expect(metadata.title).toBe("Dylan Personal OS");

    HomePage();
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
