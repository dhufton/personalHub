import { CalendarClient } from "@/components/dashboard/calendar-client";
import { AppShell } from "@/components/layout/navigation";
import { ButtonLink } from "@/components/ui/primitives";
import { getDashboardData } from "@/lib/dashboard-service";

export default async function CalendarPage() {
  const data = await getDashboardData();

  return (
    <AppShell active="calendar" profile={data.profile} cta={<ButtonLink href="/settings#apple-calendars" variant="secondary">Add calendar</ButtonLink>}>
      <CalendarClient data={data} />
    </AppShell>
  );
}
