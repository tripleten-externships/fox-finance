// // apps/admin-dashboard/src/api/dashboard.ts
// import type {DashboardData} from "../hooks/useDashboardData"
// export async function fetchDashboardData():  Promise<DashboardData> {
//   const res = await fetch("/api/dashboard");

//   if (!res.ok) {
//     throw new Error("Failed to fetch dashboard data");
//   }

//   return res.json();
// }
// apps/admin-dashboard/src/api/dashboard.ts
import type { DashboardData } from "../hooks/useDashboardData";

/**
 * Fetches the current dashboard metrics
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  const res = await fetch("/api/dashboard");

  if (!res.ok) {
    // React Query will catch this and trigger the 'retry' logic
    throw new Error(`Failed to fetch dashboard data: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Updates dashboard metrics (Used for Optimistic UI updates)
 */
export async function updateDashboardDataApi(
  payload: Partial<DashboardData>
): Promise<DashboardData> {
  const res = await fetch("/api/dashboard", {
    method: "PATCH", // Or POST depending on your backend
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // This error triggers the 'onError' rollback in useDashboardData.ts
    throw new Error("Failed to update dashboard settings");
  }

  return res.json();
}