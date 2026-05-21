import Link from "next/link";
import type { UserProfile } from "@/lib/types";

type ActiveRoute = "dashboard" | "calendar" | "finances" | "settings";

const navItems: Array<{ href: string; label: string; key: ActiveRoute; cue: string; glyph: string }> = [
  { href: "/dashboard", label: "Home", key: "dashboard", cue: "Today", glyph: "OS" },
  { href: "/calendar", label: "Calendar", key: "calendar", cue: "Events", glyph: "07" },
  { href: "/finances", label: "Finance", key: "finances", cue: "Worth", glyph: "$" },
  { href: "/settings", label: "Settings", key: "settings", cue: "Setup", glyph: ".." }
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
        <Link className="brand" href="/dashboard" aria-label="Dylan Personal OS">
          <span className="brand-mark">D</span>
          <span>
            <span>Personal OS</span>
            <span className="brand-kicker">Private command center</span>
          </span>
        </Link>
        <nav className="nav-links" aria-label="Primary">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} aria-current={active === item.key ? "page" : undefined}>
              <span className="desktop-only">{item.glyph}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="top-actions">
          <span className="system-pill"><span className="status-dot" /> Live</span>
          {cta ?? (profile ? <span className="avatar">{profile.initials}</span> : <Link className="btn" href="/dashboard">Open</Link>)}
        </div>
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
          <span>{profile.role} · {profile.timezone}</span>
        </div>
      </div>
      <nav className="side-nav" aria-label="Dashboard">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} aria-current={active === item.key ? "page" : undefined}>
            <span className="nav-glyph">{item.glyph}</span>
            <span>
              <span>{item.label}</span>
              <small>{item.cue}</small>
            </span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span>{profile.timezone}</span>
        <form action="/auth/logout" method="post">
          <button className="side-logout" type="submit">Sign out</button>
        </form>
      </div>
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
