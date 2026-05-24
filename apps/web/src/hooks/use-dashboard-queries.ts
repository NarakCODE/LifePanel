"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardApi } from "@/lib/api-client";
import { dashboardKeys } from "@/lib/query-keys";

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const response = await dashboardApi.getStats();
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch dashboard stats");
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });
}
