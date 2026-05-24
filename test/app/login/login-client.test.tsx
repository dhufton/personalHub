import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSearchParams } from "next/navigation";
import { LoginClient } from "@/app/login/login-client";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn()
}));
vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: vi.fn()
}));
vi.mock("@/lib/env", () => ({
  getPublicSiteUrl: vi.fn(() => "https://personal.test")
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function setNext() {
  vi.mocked(useSearchParams).mockReturnValue({ get: vi.fn(() => "/settings") } as never);
}

describe("LoginClient", () => {
  it("offers the placeholder dashboard when Supabase is unavailable", () => {
    setNext();
    vi.mocked(createBrowserSupabaseClient).mockReturnValue(null);

    render(<LoginClient />);

    expect(screen.getByText("Supabase is not configured locally.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open placeholder dashboard" })).toHaveAttribute("href", "/dashboard");
  });

  it("shows sign-in authentication errors", async () => {
    setNext();
    vi.mocked(createBrowserSupabaseClient).mockReturnValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ error: { message: "Incorrect password" }, data: {} })
      }
    } as never);

    render(<LoginClient />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: " person@example.com " } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Sign in" })[1]);

    await waitFor(() => expect(screen.getByText("Incorrect password")).toBeInTheDocument());
  });

  it("submits sign-up with callback routing and prompts for email confirmation", async () => {
    setNext();
    const signUp = vi.fn().mockResolvedValue({ error: null, data: { session: null } });
    vi.mocked(createBrowserSupabaseClient).mockReturnValue({ auth: { signUp } } as never);

    render(<LoginClient />);
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "person@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(screen.getByText(/Check your email/)).toBeInTheDocument());
    expect(signUp).toHaveBeenCalledWith({
      email: "person@example.com",
      password: "password123",
      options: { emailRedirectTo: "https://personal.test/auth/callback?next=%2Fsettings" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  });
});
