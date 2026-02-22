"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

const organizationQueryKey = ["organization"] as const;

export function useOrganization(enabled = true) {
  return useQuery({
    queryKey: organizationQueryKey,
    queryFn: () => apiClient.get<{ organization: { id: string; name: string; primaryColor: string; logoUrl?: string | null } }>("/api/v1/organization"),
    enabled
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name?: string; primaryColor?: string; logoUrl?: string | null }) =>
      apiClient.patch<{ organization: { id: string; name: string; primaryColor: string; logoUrl?: string | null } }>(
        "/api/v1/organization",
        payload
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKey });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    }
  });
}

