"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type AnalyticsOverview = {
  totals: {
    totalMeetings: number;
    activeMeetings: number;
    totalScans: number;
    storageBytes: number;
  };
  timeline: Array<{ date: string; scans: number }>;
  deviceBreakdown: Record<string, number>;
  topFiles: Array<{
    id: string;
    name: string;
    meeting: { id: string; title: string };
    versions: number;
  }>;
};

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => apiClient.get<AnalyticsOverview>("/api/v1/analytics/overview")
  });
}

