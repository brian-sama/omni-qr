"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { MeetingDetail, MeetingSummary } from "@/types";

const meetingsQueryKey = ["meetings"] as const;

export function useMeetings(enabled = true) {
  return useQuery({
    queryKey: meetingsQueryKey,
    queryFn: async () => {
      const result = await apiClient.get<{ meetings: MeetingSummary[] }>("/api/v1/meetings");
      return result.meetings;
    },
    enabled
  });
}

export function useMeeting(meetingId: string) {
  return useQuery({
    queryKey: [...meetingsQueryKey, meetingId],
    queryFn: async () => {
      const result = await apiClient.get<{ meeting: MeetingDetail }>(`/api/v1/meetings/${meetingId}`);
      return result.meeting;
    },
    enabled: Boolean(meetingId)
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      title: string;
      description?: string;
      startsAt?: string;
      expiresAt?: string;
      accessPolicy?: {
        accessType: "PUBLIC" | "PASSWORD" | "PRIVATE";
        password?: string;
      };
    }) => apiClient.post<{ meeting: MeetingSummary }>("/api/v1/meetings", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingsQueryKey });
    }
  });
}

export function useMeetingMutations(meetingId: string) {
  const queryClient = useQueryClient();

  return {
    refreshMeeting: () => queryClient.invalidateQueries({ queryKey: [...meetingsQueryKey, meetingId] }),
    refreshMeetings: () => queryClient.invalidateQueries({ queryKey: meetingsQueryKey })
  };
}

