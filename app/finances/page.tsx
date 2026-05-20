import { AppShell } from "@/components/layout/navigation";
import { Panel, ScreenHeader } from "@/components/ui/primitives";
import { getDashboardData } from "@/lib/dashboard-service";
import { formatCurrency } from "@/lib/format";

export default async function FinancesPage() {
  const data = await getDashboardData();
  const snapshot = data.financeSnapshot;
  const assets = snapshot.categories.filter((category) => category.kind === "asset");
  const liabilities = snapshot.categories.filter((category) => category.kind === "liability");

  return (
    <AppShell active="finances" profile={data.profile} cta={<button className="btn" type="button">Refresh</button>}>
      <ScreenHeader
        title="Finance"
        copy="Placeholder finance snapshot. Manual entries or an OpenAI import pipeline can plug into this table later."
      />

      <section className="finance-layout">
        <div className="stack">
          <Panel title="Net worth" description={`Snapshot source: ${snapshot.source}.`}>
            <div className="metric-grid">
              <div className="metric"><span>Total</span><strong>{formatCurrency(snapshot.netWorth, snapshot.currency)}</strong></div>
              <div className="metric"><span>Assets</span><strong>{formatCurrency(sumValues(assets), snapshot.currency)}</strong></div>
              <div className="metric"><span>Liabilities</span><strong>{formatCurrency(sumValues(liabilities), snapshot.currency)}</strong></div>
            </div>
          </Panel>

          <Panel title="Categories" description="Dedicated finance_snapshots rows preserve each extracted snapshot.">
            <div className="list">
              {snapshot.categories.map((category) => (
                <div className="transaction-row" key={category.id}>
                  <div><strong>{category.name}</strong><span>{category.kind}</span></div>
                  <span>{formatCurrency(category.value, snapshot.currency)}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <aside className="stack">
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
