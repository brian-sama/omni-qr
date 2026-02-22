"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { AuthResponse } from "@/types";

const AUTH_QUERY_KEY = ["auth", "me"] as const;

export function useAuth() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => apiClient.get<AuthResponse>("/api/v1/auth/me"),
    retry: false
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      apiClient.post<AuthResponse>("/api/v1/auth/login", payload),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data);
    }
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string; email: string; password: string }) =>
      apiClient.post<AuthResponse>("/api/v1/auth/register", payload),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data);
    }
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post<void>("/api/v1/auth/logout"),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
    }
  });
}

