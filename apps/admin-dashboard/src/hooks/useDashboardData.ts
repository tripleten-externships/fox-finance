import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchDashboardData, updateDashboardDataApi } from "../api/dashboard";

/**
 * Interface representing the Dashboard state.
 * Using optional fields to handle partial updates and initial loading states.
 */
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

/**
 * Context type for the mutation rollback mechanism.
 */
interface MutationContext {
  previousData?: DashboardData;
}

export function useDashboardData() {
  const queryClient = useQueryClient();
  const [isTabActive, setIsTabActive] = useState<boolean>(!document.hidden);

  // 1. Sync internal state with document visibility (Battery Efficiency)
  useEffect(() => {
    const handleVisibilityChange = () => setIsTabActive(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // 2. Main Data Fetching Hook
  const { data, error, isFetching, refetch } = useQuery<DashboardData, Error>({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    refetchInterval: () => {
      if (!navigator.onLine) return false;
      // Acceptance Criteria: 5s if active, 15s if backgrounded
      return isTabActive ? 5000 : 15000;
    },
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: 2,
    placeholderData: (prev) => prev ?? {
      totalUsers: 0,
      activeUsers: 0,
      uploadsToday: 0,
      lastUpdated: new Date().toISOString(),
    },
  });

  // 3. Optimistic Mutation Hook
  // Generics: <DataReceived, ErrorType, VariablesType, ContextType>
  const mutation = useMutation<DashboardData, Error, Partial<DashboardData>, MutationContext>({
    mutationFn: (variables) => updateDashboardDataApi(variables),
    
    onMutate: async (partialUpdate: Partial<DashboardData>) => {
      // Cancel outgoing refetches so they don't overwrite optimistic UI
      await queryClient.cancelQueries({ queryKey: ["dashboard"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<DashboardData>(["dashboard"]);

      // Optimistically update the UI
      queryClient.setQueryData<DashboardData>(["dashboard"], (old) => ({
        ...(old ?? {}),
        ...partialUpdate,
        lastUpdated: new Date().toISOString(),
      }));

      // Return context for rollback
      return { previousData };
    },

    onError: (err: Error, _variables, context) => {
      // Graceful handling: Roll back to previous state on failure
      if (context?.previousData) {
        queryClient.setQueryData(["dashboard"], context.previousData);
      }
      console.error("Dashboard update failed:", err.message);
    },

    onSettled: () => {
      // Always invalidate to sync with server truth
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  // 4. Manual Online Listener (Extra safety for connection issues)
  useEffect(() => {
    const handleOnline = () => {
      if (navigator.onLine) refetch();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [refetch]);

  return {
    data,
    error,
    isFetching,
    // Methods for UI interaction
    updateDashboard: mutation.mutate, 
    isLoadingUpdate: mutation.isPending,
    updateError: mutation.error,
  };
}
