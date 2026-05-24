"use client";

import { useRouter } from "next/navigation";

import type { MeResponseDto } from "@repo/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authApi } from "@/lib/api-client";
import { deleteClientCookie, setClientCookie } from "@/lib/cookie.client";
import { setLocalStorageValue } from "@/lib/local-storage.client";
import { authKeys } from "@/lib/query-keys";

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      const response = await authApi.getMe();
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch user");
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await authApi.login(email, password);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to log in");
      }
      return response.data;
    },
    onSuccess: async (tokens) => {
      const { accessToken, refreshToken } = tokens;

      setLocalStorageValue("auth_token", accessToken);
      setLocalStorageValue("refresh_token", refreshToken);
      setClientCookie("auth_token", accessToken, 7);

      const meResponse = await authApi.getMe();
      if (meResponse.success && meResponse.data) {
        queryClient.setQueryData(authKeys.me(), meResponse.data);
        toast.success("Logged in successfully", {
          description: "Welcome back!",
        });
        router.refresh();
        router.push("/dashboard/default");
      } else {
        throw new Error("Failed to load user profile after login");
      }
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      await authApi.logout().catch(() => {
        // Intentionally suppress errors to ensure local cleanup always runs
      });
    },
    onSuccess: () => {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("auth_token");
        window.localStorage.removeItem("refresh_token");
      }
      deleteClientCookie("auth_token");

      queryClient.setQueryData(authKeys.me(), null);
      queryClient.invalidateQueries({ queryKey: authKeys.all });

      toast.success("Logged out successfully", {
        description: "See you next time!",
      });

      router.refresh();
      router.push("/auth/v2/login");
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async ({ email, password, displayName }: { email: string; password: string; displayName: string }) => {
      const response = await authApi.register(email, password, displayName);
      if (!response.success) {
        throw new Error(response.message || "Failed to register");
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success("Registration successful", {
        description: "Please check your email to verify your account",
      });
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: async ({ email, code }: { email: string; code: string }) => {
      const response = await authApi.verifyEmail(email, code);
      if (!response.success) {
        throw new Error(response.message || "Failed to verify email");
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success("Email verified", {
        description: "Your email has been verified successfully",
      });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: MeResponseDto) => {
      queryClient.setQueryData(authKeys.me(), user);
      return user;
    },
    onSuccess: (_user) => {
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}
