import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { AppShell } from "@/components/layout/navigation";
import { getDashboardData } from "@/lib/dashboard-service";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <AppShell active="dashboard" profile={data.profile}>
      <DashboardClient initialData={data} />
    </AppShell>
  );
}
