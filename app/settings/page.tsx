import { SettingsClient } from "@/components/dashboard/settings-client";
import { AppShell } from "@/components/layout/navigation";
import { ButtonLink } from "@/components/ui/primitives";
import { getDashboardData } from "@/lib/dashboard-service";

export default async function SettingsPage() {
  const data = await getDashboardData();

  return (
    <AppShell active="settings" profile={data.profile} cta={<ButtonLink href="/dashboard" variant="secondary">Done</ButtonLink>}>
      <SettingsClient profile={data.profile} connectedAccounts={data.connectedAccounts} habits={data.habits} />
    </AppShell>
  );
}
