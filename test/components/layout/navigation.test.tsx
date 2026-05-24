import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppShell, Sidebar, TopNav } from "@/components/layout/navigation";
import { dashboardFixture } from "@/test/fixtures";

afterEach(cleanup);

const profile = dashboardFixture().profile;

describe("navigation", () => {
  it("marks the active top-level route and renders a supplied action", () => {
    render(<TopNav active="calendar" profile={profile} cta={<button>Create</button>} />);

    expect(screen.getByRole("link", { name: /Calendar/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("displays profile information and sign out in the sidebar", () => {
    render(<Sidebar active="settings" profile={profile} />);

    expect(screen.getByText(profile.name)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Settings/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("wraps page content with the application shell", () => {
    render(
      <AppShell active="dashboard" profile={profile}>
        <h1>Home content</h1>
      </AppShell>
    );

    expect(screen.getByRole("heading", { name: "Home content" })).toBeInTheDocument();
    expect(screen.getAllByText("Personal OS").length).toBeGreaterThan(0);
  });
});
