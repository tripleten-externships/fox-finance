// apps/admin-dashboard/src/api/dashboard.ts
import type {DashboardData} from "../hooks/useDashboardData"
export async function fetchDashboardData():  Promise<DashboardData> {
  const res = await fetch("/api/dashboard");

  if (!res.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  return res.json();
}