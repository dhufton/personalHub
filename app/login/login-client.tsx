"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ButtonLink } from "@/components/ui/primitives";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LoginClient() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function signInWithEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !email.trim()) return;

    setIsPending(true);
    setStatus("");
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });
    setIsPending(false);
    setStatus(error ? error.message : "Check your email for the login link.");
  }

  async function signInWithGoogle() {
    if (!supabase) return;

    setIsPending(true);
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });
    setIsPending(false);
    if (error) setStatus(error.message);
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div>
          <span className="brand-mark">D</span>
          <h1 className="screen-title">Personal OS</h1>
          <p className="screen-copy">
            Sign in with Supabase Auth when configured. Without Supabase env vars, the local placeholder dashboard remains available.
          </p>
        </div>

        {supabase ? (
          <>
            <button className="btn auth-google" type="button" onClick={signInWithGoogle} disabled={isPending}>
              Continue with Google
            </button>
            <form className="auth-form" onSubmit={signInWithEmail}>
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
              <button className="btn" type="submit" disabled={isPending}>
                Send magic link
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
