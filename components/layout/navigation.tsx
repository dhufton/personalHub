import Link from "next/link";
import type { UserProfile } from "@/lib/types";

type ActiveRoute = "overview" | "dashboard" | "calendar" | "finances" | "settings";

const navItems: Array<{ href: string; label: string; key: ActiveRoute }> = [
  { href: "/landing", label: "Overview", key: "overview" },
  { href: "/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/calendar", label: "Calendar", key: "calendar" },
  { href: "/finances", label: "Finances", key: "finances" },
  { href: "/settings", label: "Settings", key: "settings" }
];

export function TopNav({
  active,
  cta,
  profile
}: {
  active?: ActiveRoute;
  cta?: React.ReactNode;
  profile?: UserProfile;
}) {
  return (
    <header className="topbar">
      <div className="wide-container topbar-inner">
        <Link className="brand" href="/" aria-label="Dylan Home">
          <span className="brand-mark">D</span>
          <span>Dylan Home</span>
        </Link>
        <nav className="nav-links" aria-label="Primary">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} aria-current={active === item.key ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        {cta ?? (profile ? <span className="avatar">{profile.initials}</span> : <Link className="btn" href="/dashboard">Open dashboard</Link>)}
      </div>
    </header>
  );
}

export function Sidebar({ active, profile }: { active: ActiveRoute; profile: UserProfile }) {
  return (
    <aside className="sidebar">
      <div className="side-profile">
        <span className="avatar">{profile.initials}</span>
        <div>
          <strong>{profile.name}</strong>
          <span>{profile.email}</span>
        </div>
      </div>
      <nav className="side-nav" aria-label="Dashboard">
        <Link href="/dashboard" aria-current={active === "dashboard" ? "page" : undefined}>Today</Link>
        <Link href="/calendar" aria-current={active === "calendar" ? "page" : undefined}>Calendar</Link>
        <Link href="/finances" aria-current={active === "finances" ? "page" : undefined}>Finances</Link>
        <Link href="/settings" aria-current={active === "settings" ? "page" : undefined}>Settings</Link>
        <Link href="/landing" aria-current={active === "overview" ? "page" : undefined}>Overview</Link>
      </nav>
    </aside>
  );
}

export function AppShell({
  active,
  profile,
  cta,
  children
}: {
  active: ActiveRoute;
  profile: UserProfile;
  cta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-body">
      <TopNav active={active} profile={profile} cta={cta} />
      <div className="app-layout">
        <Sidebar active={active} profile={profile} />
        <main>{children}</main>
      </div>
    </div>
  );
}
