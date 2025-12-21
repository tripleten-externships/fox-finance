import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchDashboardData } from "../api/dashboard";

export interface DashboardData {
  // High-level metrics
  totalUsers?: number;
  activeUsers?: number;
  newUsersToday?: number;

  // Upload / activity metrics
  totalUploads?: number;
  uploadsToday?: number;

  // System health
  serverStatus?: "healthy" | "degraded" | "offline";
  apiLatencyMs?: number;

  // Optional business metrics
  revenueToday?: number;
  revenueThisMonth?: number;

  // Timestamps
  lastUpdated?: string; // ISO timestamp
}

export function useDashboardData() {
  const queryClient = useQueryClient();

  const { data, error, isFetching, refetch } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    refetchInterval: () => {
      // Stop polling if offline
      if (!navigator.onLine) return false;

      // Slow down polling when tab is hidden
      if (document.hidden) return 15000;

      // Normal polling when active
      return 5000; // meets the 5-second requirement
    },
      // Continue polling even when tab is hidden (but at a slower interval above)
      refetchIntervalInBackground: true,

     // Refresh when user returns to the tab
    refetchOnWindowFocus: true,
     // No stale cache — always fresh
    staleTime: 0,
   //Graceful retry behavior
    retry: 1,
    //Prevent undefined UI flicker
    placeholderData: {
      totalUsers: 0,
      activeUsers: 0,
      uploadsToday: 0,
      lastUpdated: new Date().toISOString(),
    },
  });

  // Optimistic UI example
  const updateDashboardOptimistically = (
    partialUpdate: Partial<DashboardData>
  ) => {
    queryClient.setQueryData<DashboardData>(["dashboard"], (previousData) => ({
      ...(previousData ?? {}),
      ...partialUpdate,
      lastUpdated: new Date().toISOString(),

    }));
  };

  // Graceful handling of connection issues
  useEffect(() => {
    const handleOnline = () => refetch();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [refetch]);

  return {
    data,
    error,
    isFetching,
    updateDashboardOptimistically,
  };
}


