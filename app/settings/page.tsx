import { SettingsClient } from "@/components/dashboard/settings-client";
import { AppShell } from "@/components/layout/navigation";
import { getDashboardData } from "@/lib/dashboard-service";

export default async function SettingsPage() {
  const data = await getDashboardData();

  return (
    <AppShell active="settings" profile={data.profile} cta={<button className="btn" type="button">Save</button>}>
      <SettingsClient profile={data.profile} connectedAccounts={data.connectedAccounts} />
    </AppShell>
  );
}
