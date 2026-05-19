import { AppShell } from "@/components/layout/navigation";
import { Panel, ScreenHeader } from "@/components/ui/primitives";
import { getDashboardData } from "@/lib/dashboard-service";
import { formatCurrency, percentage } from "@/lib/format";

export default async function FinancesPage() {
  const data = await getDashboardData();

  return (
    <AppShell active="finances" profile={data.profile} cta={<button className="btn" type="button">Update budget</button>}>
      <ScreenHeader
        title="Finances"
        copy="Balances, savings progress, and recurring commitments for May."
        actions={
          <>
            <button className="btn secondary" type="button">Download</button>
            <button className="btn" type="button">Move money</button>
          </>
        }
      />

      <section className="finance-layout">
        <div className="stack">
          <Panel title="Account balances" description="Updated at 09:14.">
            <div className="account-grid">
              {data.accounts.map((account) => (
                <div className="account-card" key={account.id}>
                  <span>{account.name}</span>
                  <strong>{formatCurrency(account.balance, account.currency)}</strong>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Savings goals" description="Two active goals with clear monthly targets.">
            {data.savingsGoals.map((goal) => {
              const progress = percentage(goal.current, goal.target);
              return (
                <div className="goal" key={goal.id}>
                  <div className="mini-row">
                    <div><strong>{goal.name}</strong><span>{formatCurrency(goal.current)} of {formatCurrency(goal.target)}</span></div>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress"><span style={{ width: `${progress}%` }} /></div>
                </div>
              );
            })}
          </Panel>

          <Panel title="Recent transactions" description="Last five personal payments.">
            <div className="list">
              {data.transactions.map((transaction) => (
                <div className="transaction-row" key={transaction.id}>
                  <div><strong>{transaction.merchant}</strong><span>{transaction.category}</span></div>
                  <span>{formatCurrency(transaction.amount)}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <aside className="stack">
          <Panel title="Bills" description="Upcoming recurring costs.">
            <div className="list">
              {data.bills.map((bill) => (
                <div className="list-row" key={bill.id}>
                  <div><strong>{bill.name}</strong><span>{bill.dueDate}</span></div>
                  <span>{formatCurrency(bill.amount)}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Subscriptions" description="Reviewed status is ready to persist later.">
            <div className="list">
              {data.subscriptions.map((subscription) => (
                <div className={`list-row${subscription.reviewed ? " is-done" : ""}`} key={subscription.id}>
                  <span className="check" aria-hidden="true" />
                  <div><strong>{subscription.name}</strong><span>{subscription.dueDate}</span></div>
                  <span>{formatCurrency(subscription.amount)}</span>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </section>
    </AppShell>
  );
}
