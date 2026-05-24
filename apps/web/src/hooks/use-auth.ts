"use client";

import { useCurrentUser, useLogin, useLogout } from "@/hooks/use-auth-queries";

export function useAuth() {
  const { data: user, isLoading, isError } = useCurrentUser();
  const { mutateAsync: login, isPending: isLoggingIn } = useLogin();
  const { mutateAsync: logout, isPending: isLoggingOut } = useLogout();

  return {
    user: user ?? null,
    isAuthenticated: !!user && !isError,
    isLoading,
    error: isError ? "Authentication failed" : null,
    isLoggingIn,
    isLoggingOut,
    login: (email: string, password: string) => login({ email, password }),
    logout: () => logout(),
    setError: () => {
      // No-op: TanStack Query handles errors via mutation callbacks
    },
  };
}
