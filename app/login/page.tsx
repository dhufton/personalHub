import { Suspense } from "react";
import { LoginClient } from "@/app/login/login-client";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <span className="brand-mark">D</span>
        <h1 className="screen-title">Personal OS</h1>
        <p className="screen-copy">Loading sign-in...</p>
      </section>
    </main>
  );
}
