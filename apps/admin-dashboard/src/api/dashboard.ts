// apps/admin-dashboard/src/api/dashboard.ts

export async function fetchDashboardData() {
  const res = await fetch("/api/dashboard");

  if (!res.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  return res.json();
}