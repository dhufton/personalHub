import { AppShell } from "@/components/layout/navigation";
import { ButtonLink, Panel, ScreenHeader } from "@/components/ui/primitives";
import { getDashboardData } from "@/lib/dashboard-service";
import { formatCurrency } from "@/lib/format";

export default async function FinancesPage() {
  const data = await getDashboardData();
  const snapshot = data.financeSnapshot;
  const assets = snapshot.categories.filter((category) => category.kind === "asset");
  const liabilities = snapshot.categories.filter((category) => category.kind === "liability");
  const maxCategoryValue = Math.max(...snapshot.categories.map((category) => Math.abs(category.value)), 1);
  const coverage = Math.round((sumValues(assets) / Math.max(Math.abs(sumValues(liabilities)), 1)) * 10) / 10;

  return (
    <AppShell active="finances" profile={data.profile} cta={<ButtonLink href="/settings#apple-calendars" variant="secondary">Connect data</ButtonLink>}>
      <ScreenHeader
        title="Finance"
        copy="A readable money surface for net worth, category balance, and future import review."
      />

      <section className="finance-layout">
        <div className="stack">
          <Panel title="Net worth" description={`Snapshot source: ${snapshot.source}.`}>
            <div className="metric-grid">
              <div className="metric is-good"><span>Total</span><strong>{formatCurrency(snapshot.netWorth, snapshot.currency)}</strong></div>
              <div className="metric"><span>Assets</span><strong>{formatCurrency(sumValues(assets), snapshot.currency)}</strong></div>
              <div className="metric is-warn"><span>Liabilities</span><strong>{formatCurrency(sumValues(liabilities), snapshot.currency)}</strong></div>
            </div>
            <div className="finance-chart" aria-label="Category value chart">
              {snapshot.categories.map((category) => (
                <div className="bar-wrap" key={category.id}>
                  <span
                    className={`bar ${category.kind}`}
                    style={{ height: `${Math.max((Math.abs(category.value) / maxCategoryValue) * 100, 8)}%` }}
                  />
                  <small>{category.name}</small>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Categories" description="Dedicated finance_snapshots rows preserve each extracted snapshot.">
            <div className="list">
              {snapshot.categories.map((category) => (
                <div className="transaction-row" key={category.id}>
                  <div><strong>{category.name}</strong><span>{category.kind}</span></div>
                  <span className={category.kind === "asset" ? "money-positive" : "money-negative"}>{formatCurrency(category.value, snapshot.currency)}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <aside className="stack">
          <Panel title="Position" description="Simple health indicators for review.">
            <div className="metric-grid side-metrics">
              <div className="metric"><span>Coverage</span><strong>{coverage}x</strong></div>
              <div className="metric"><span>Accounts</span><strong>{snapshot.categories.length}</strong></div>
            </div>
            <div className="goal">
              <div className="mini-row"><div><strong>Asset share</strong><span>Assets against total tracked categories</span></div><span>{Math.round((sumValues(assets) / Math.max(sumValues(assets) + Math.abs(sumValues(liabilities)), 1)) * 100)}%</span></div>
              <div className="progress"><span style={{ width: `${Math.round((sumValues(assets) / Math.max(sumValues(assets) + Math.abs(sumValues(liabilities)), 1)) * 100)}%` }} /></div>
            </div>
          </Panel>

          <Panel title="Extraction notes" description="Human review hooks for future AI finance parsing.">
            <div className="list">
              {snapshot.notes.map((note) => (
                <div className="list-row" key={note}>
                  <div><strong>{note}</strong><span>{new Date(snapshot.asOf).toLocaleString("en-GB", { timeZone: data.profile.timezone })}</span></div>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </section>
    </AppShell>
  );
}

function sumValues(items: Array<{ value: number }>) {
  return items.reduce((sum, item) => sum + item.value, 0);
}
