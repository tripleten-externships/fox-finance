import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDashboardData } from "../api/dashboard";


export interface DashboardData {
  totalUploads: number;
  pendingRequests: number;
  recentUploads: Array<{
    id: string;
    fileName: string;
    createdAt: string;
  }>;
}
export function useDashboardData() {
  const queryClient = useQueryClient();

  const query = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,

    // Real-time updates every 5 seconds
    refetchInterval: 5000,

    // Battery-efficient: stops when tab is hidden
    refetchIntervalInBackground: false,

    // Graceful handling of connection issues
    retry: 3,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 8000),

    // Optimistic UI support
    placeholderData: previous => previous
  });

  // Optional: manual optimistic update helper
  const optimisticUpdate = (partial: Partial<DashboardData>) => {
  queryClient.setQueryData<DashboardData>(["dashboard"], old => ({
    ...old!,   // old is DashboardData | undefined
    ...partial
  }));
};

  return {
    ...query,
    optimisticUpdate
  };
}