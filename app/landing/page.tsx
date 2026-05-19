import { TopNav } from "@/components/layout/navigation";
import { ButtonLink } from "@/components/ui/primitives";

export default function LandingPage() {
  return (
    <>
      <TopNav active="overview" cta={<ButtonLink href="/dashboard">Open</ButtonLink>} />
      <main>
        <section className="hero">
          <div className="wide-container">
            <div>
              <h1 className="hero-title">One personal dashboard for what matters today.</h1>
              <p className="hero-copy">A private-feeling home page that balances tasks, calendar planning, money awareness, and habits without turning the day into a spreadsheet.</p>
              <div className="hero-actions">
                <ButtonLink href="/dashboard">View today</ButtonLink>
                <button className="btn secondary" type="button">Save as home</button>
              </div>
            </div>
            <div className="glass-panel">
              <div className="mini-dashboard">
                <div className="mini-row"><div><strong>Morning plan</strong><span>Client draft, gym, grocery order</span></div><span>3h 20m</span></div>
                <div className="mini-row"><div><strong>Month cashflow</strong><span>£1,842 after bills</span></div><span>On track</span></div>
                <div className="mini-row"><div><strong>Next event</strong><span>Design review, 14:30</span></div><span>Zoom</span></div>
                <div className="mini-row"><div><strong>Habit close</strong><span>Reading remains</span></div><span>2/3</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section surface">
          <div className="container">
            <h2 className="section-title">Four daily systems, one rhythm.</h2>
            <div className="feature-grid">
              <Feature title="Reminders" copy="Prioritized tasks with quick add and completion states for the day." />
              <Feature title="Calendar" copy="A compact home preview plus full week and month planning views." />
              <Feature title="Finances" copy="Account balances, savings progress, bills, and subscriptions in one read." />
              <Feature title="Habits" copy="Simple streak tracking that stays visible without dominating the page." />
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2 className="section-title">Built like a personal operating surface.</h2>
            <p className="section-lead">The home screen keeps the current day readable. Detail pages expand only when planning or finances need more room.</p>
            <div className="launcher-grid">
              <a className="launcher-card" href="/dashboard"><span className="eyebrow">Daily</span><h2 className="card-title">Command center</h2><p>One glance for today’s priorities.</p></a>
              <a className="launcher-card" href="/calendar"><span className="eyebrow">Weekly</span><h2 className="card-title">Planner</h2><p>Move between week blocks and month context.</p></a>
              <a className="launcher-card" href="/finances"><span className="eyebrow">Monthly</span><h2 className="card-title">Money view</h2><p>Track balances, goals, and recurring costs.</p></a>
              <a className="launcher-card" href="/settings"><span className="eyebrow">Personal</span><h2 className="card-title">Settings</h2><p>Keep profile and connected accounts tidy.</p></a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function Feature({ title, copy }: { title: string; copy: string }) {
  return (
    <article className="feature-card">
      <h3 className="card-title">{title}</h3>
      <p>{copy}</p>
    </article>
  );
}
