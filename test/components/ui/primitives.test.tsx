import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ButtonLink, Panel, ScreenHeader } from "@/components/ui/primitives";

afterEach(cleanup);

describe("ButtonLink", () => {
  it("renders a styled link for an alternate variant", () => {
    render(
      <ButtonLink href="/settings" variant="secondary">
        Settings
      </ButtonLink>
    );

    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("link", { name: "Settings" })).toHaveClass("btn", "secondary");
  });
});

describe("Panel", () => {
  it("renders its optional supporting content and action", () => {
    render(
      <Panel title="Calendar" description="Upcoming events" kicker="Today" action={<button>Refresh</button>}>
        <p>Planning at 10:00</p>
      </Panel>
    );

    expect(screen.getByRole("heading", { name: "Calendar" })).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Upcoming events")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByText("Planning at 10:00")).toBeInTheDocument();
  });
});

describe("ScreenHeader", () => {
  it("renders supplied toolbar actions", () => {
    render(<ScreenHeader title="Dashboard" copy="Your day" actions={<button>Add task</button>} />);

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add task" })).toBeInTheDocument();
  });
});
