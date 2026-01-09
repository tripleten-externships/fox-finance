// import { useQuery, useQueryClient } from "@tanstack/react-query";
// import { useEffect } from "react";
// import { fetchDashboardData } from "../api/dashboard";

// export interface DashboardData {
//   // High-level metrics
//   totalUsers?: number;
//   activeUsers?: number;
//   newUsersToday?: number;

//   // Upload / activity metrics
//   totalUploads?: number;
//   uploadsToday?: number;

//   // System health
//   serverStatus?: "healthy" | "degraded" | "offline";
//   apiLatencyMs?: number;

//   // Optional business metrics
//   revenueToday?: number;
//   revenueThisMonth?: number;

//   // Timestamps
//   lastUpdated?: string; // ISO timestamp
// }

// export function useDashboardData() {
//   const queryClient = useQueryClient();

//   const { data, error, isFetching, refetch } = useQuery<DashboardData>({
//     queryKey: ["dashboard"],
//     queryFn: fetchDashboardData,
//     refetchInterval: () => {
//       // Stop polling if offline
//       if (!navigator.onLine) return false;

//       // Slow down polling when tab is hidden
//       if (document.hidden) return 15000;

//       // Normal polling when active
//       return 5000; // meets the 5-second requirement
//     },
//       // Continue polling even when tab is hidden (but at a slower interval above)
//       refetchIntervalInBackground: true,

//      // Refresh when user returns to the tab
//     refetchOnWindowFocus: true,
//      // No stale cache — always fresh
//     staleTime: 0,
//    //Graceful retry behavior
//     retry: 1,
//     //Prevent undefined UI flicker
//     placeholderData: {
//       totalUsers: 0,
//       activeUsers: 0,
//       uploadsToday: 0,
//       lastUpdated: new Date().toISOString(),
//     },
//   });

//   // Optimistic UI example
//   const updateDashboardOptimistically = (
//     partialUpdate: Partial<DashboardData>
//   ) => {
//     queryClient.setQueryData<DashboardData>(["dashboard"], (previousData) => ({
//       ...(previousData ?? {}),
//       ...partialUpdate,
//       lastUpdated: new Date().toISOString(),

//     }));
//   };

//   // Graceful handling of connection issues
//   useEffect(() => {
//     const handleOnline = () => refetch();
//     window.addEventListener("online", handleOnline);
//     return () => window.removeEventListener("online", handleOnline);
//   }, [refetch]);

//   return {
//     data,
//     error,
//     isFetching,
//     updateDashboardOptimistically,
//   };
// }
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchDashboardData, updateDashboardDataApi } from "../api/dashboard";

export interface DashboardData {
  totalUsers?: number;
  activeUsers?: number;
  newUsersToday?: number;
  totalUploads?: number;
  uploadsToday?: number;
  serverStatus?: "healthy" | "degraded" | "offline";
  apiLatencyMs?: number;
  revenueToday?: number;
  revenueThisMonth?: number;
  lastUpdated?: string;
}

export function useDashboardData() {
  const queryClient = useQueryClient();
  const [isTabActive, setIsTabActive] = useState(!document.hidden);

  // 1. Sync internal state with document visibility
  useEffect(() => {
    const handleVisibilityChange = () => setIsTabActive(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // 2. Main Data Fetching Hook
  const { data, error, isFetching, refetch } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    refetchInterval: () => {
      if (!navigator.onLine) return false;
      // Smart Polling: 5s if active, 15s if backgrounded
      return isTabActive ? 5000 : 15000;
    },
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: 2, // Slightly more robust retry
    placeholderData: (prev) => prev ?? {
      totalUsers: 0,
      activeUsers: 0,
      uploadsToday: 0,
      lastUpdated: new Date().toISOString(),
    },
  });

  // 3. Refined Optimistic Mutation
  // This handles the "Acceptance Criteria" for Optimistic UI + Graceful Errors
  const mutation = useMutation({
    mutationFn: (variables: Partial<DashboardData>) => updateDashboardDataApi(variables),
    
    // When mutate is called:
    onMutate: async (partialUpdate) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["dashboard"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<DashboardData>(["dashboard"]);

      // Optimistically update the UI
      queryClient.setQueryData<DashboardData>(["dashboard"], (old) => ({
        ...(old ?? {}),
        ...partialUpdate,
        lastUpdated: new Date().toISOString(),
      }));

      // Return a context object with the snapshotted value
      return { previousData };
    },

    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, _newVariables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["dashboard"], context.previousData);
      }
      console.error("Dashboard update failed. Rolling back changes.", err);
    },

    // Always refetch after error or success to ensure we are in sync with the server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  // 4. Manual Online Listener (Extra safety for connection issues)
  useEffect(() => {
    const handleOnline = () => refetch();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [refetch]);

  return {
    data,
    error,
    isFetching,
    // Use this for UI actions (e.g., clicking a 'Refresh' or 'Reset' button)
    updateDashboard: mutation.mutate, 
    isLoadingUpdate: mutation.isPending,
    updateError: mutation.error,
  };
}

