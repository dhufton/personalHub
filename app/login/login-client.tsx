"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ButtonLink } from "@/components/ui/primitives";
import { getPublicSiteUrl } from "@/lib/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LoginClient() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function submitEmailPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !email.trim() || !password) return;

    setIsPending(true);
    setStatus("");

    const result =
      mode === "sign-up"
        ? await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo: `${getAuthBaseUrl()}/auth/callback?next=${encodeURIComponent(next)}`
            }
          })
        : await supabase.auth.signInWithPassword({
            email: email.trim(),
            password
          });
    setIsPending(false);

    if (result.error) {
      setStatus(result.error.message);
      return;
    }

    if (mode === "sign-up" && !result.data.session) {
      setStatus("Check your email to confirm your account, then sign in.");
      return;
    }

    window.location.assign(next);
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div>
          <span className="brand-mark">D</span>
          <h1 className="screen-title">Personal OS</h1>
          <p className="screen-copy">
            Sign in with email and password. Without Supabase env vars, the local placeholder dashboard remains available.
          </p>
        </div>

        {supabase ? (
          <>
            <div className="segmented auth-mode" aria-label="Authentication mode">
              <button className={mode === "sign-in" ? "is-active" : ""} type="button" onClick={() => setMode("sign-in")}>
                Sign in
              </button>
              <button className={mode === "sign-up" ? "is-active" : ""} type="button" onClick={() => setMode("sign-up")}>
                Sign up
              </button>
            </div>
            <form className="auth-form" onSubmit={submitEmailPassword}>
              <label>
                Email
                <input
                  className="field-input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="dylan@example.com"
                />
              </label>
              <label>
                Password
                <input
                  className="field-input"
                  type="password"
                  autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                />
              </label>
              <button className="btn" type="submit" disabled={isPending}>
                {isPending ? "Please wait..." : mode === "sign-up" ? "Create account" : "Sign in"}
              </button>
            </form>
            {status ? <p className="auth-status">{status}</p> : null}
          </>
        ) : (
          <div className="auth-placeholder">
            <strong>Supabase is not configured locally.</strong>
            <p>Add Supabase env vars to enable OAuth/email login. The app will use placeholder data until then.</p>
            <ButtonLink href="/dashboard">Open placeholder dashboard</ButtonLink>
          </div>
        )}
      </section>
    </main>
  );
}

function getAuthBaseUrl() {
  return getPublicSiteUrl() ?? window.location.origin;
}
