import { sampleDashboardData } from "@/lib/sample-data";
import type { DashboardData } from "@/lib/types";

export function dashboardFixture(): DashboardData {
  return structuredClone(sampleDashboardData);
}
