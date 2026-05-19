import { TopNav } from "@/components/layout/navigation";
import { ButtonLink } from "@/components/ui/primitives";
import { getDashboardData } from "@/lib/dashboard-service";
import { formatCurrency, percentage } from "@/lib/format";

export default async function HomePage() {
  const data = await getDashboardData();
  const currentBalance = data.accounts.find((account) => account.kind === "current")?.balance ?? 0;
  const primaryGoal = data.savingsGoals[0];

  return (
    <>
      <TopNav active="overview" cta={<ButtonLink href="/dashboard">Open dashboard</ButtonLink>} />
      <main>
        <section className="hero">
          <div className="container">
            <div>
              <h1 className="hero-title">A calmer home for the day.</h1>
              <p className="hero-copy">Reminders, week planning, money movement, and habits share one Apple-style command center with focused detail pages when it is time to go deeper.</p>
              <div className="hero-actions">
                <ButtonLink href="/dashboard">Start from today</ButtonLink>
                <ButtonLink href="/landing" variant="secondary">See overview</ButtonLink>
              </div>
            </div>
            <div className="glass-panel" aria-label="Today preview">
              <div className="mini-dashboard">
                <div className="mini-row"><div><strong>Today</strong><span>{data.reminders.length} priorities, {data.calendarEvents.filter((event) => event.day === "Tue").length} events</span></div><span>May 19</span></div>
                <div className="mini-row"><div><strong>Budget health</strong><span>{formatCurrency(currentBalance)} available</span></div><span>{percentage(primaryGoal.current, primaryGoal.target)}%</span></div>
                <div className="mini-row"><div><strong>Habits</strong><span>Workout, reading, water</span></div><span>5 day streak</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section surface">
          <div className="container">
            <h2 className="section-title">Choose where to begin.</h2>
            <p className="section-lead">Each surface is its own route, so the dashboard stays focused while detailed views have room for real controls.</p>
            <div className="launcher-grid">
              <LauncherCard href="/dashboard" label="Home" title="Personal dashboard" copy="Today’s reminders, agenda, finance pulse, and habit streaks." />
              <LauncherCard href="/calendar" label="Planning" title="Calendar detail" copy="Week planner and month overview with selectable views." />
              <LauncherCard href="/finances" label="Money" title="Finance detail" copy="Accounts, savings goals, bills, and subscriptions." />
              <LauncherCard href="/settings" label="Account" title="User settings" copy="Profile and connected account preferences for Dylan." />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function LauncherCard({ href, label, title, copy }: { href: string; label: string; title: string; copy: string }) {
  return (
    <a className="launcher-card" href={href}>
      <span className="eyebrow">{label}</span>
      <h2 className="card-title">{title}</h2>
      <p>{copy}</p>
    </a>
  );
}
