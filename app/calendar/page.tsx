import { CalendarClient } from "@/components/dashboard/calendar-client";
import { AppShell } from "@/components/layout/navigation";
import { getDashboardData } from "@/lib/dashboard-service";

export default async function CalendarPage() {
  const data = await getDashboardData();

  return (
    <AppShell active="calendar" profile={data.profile} cta={<button className="btn" type="button">New event</button>}>
      <CalendarClient data={data} />
    </AppShell>
  );
}
