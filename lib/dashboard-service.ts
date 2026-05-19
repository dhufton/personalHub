import { sampleDashboardData } from "@/lib/sample-data";
import { getSupabaseClient } from "@/lib/supabase";
import type { DashboardData } from "@/lib/types";

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return sampleDashboardData;
  }

  const { data, error } = await supabase
    .from("dashboard_snapshots")
    .select("payload")
    .eq("user_id", sampleDashboardData.profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.payload) {
    return sampleDashboardData;
  }

  return data.payload as DashboardData;
}
