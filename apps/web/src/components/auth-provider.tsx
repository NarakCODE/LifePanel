"use client";

import { type ReactNode, useEffect } from "react";

import { usePathname, useRouter } from "next/navigation";

import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser } from "@/hooks/use-auth-queries";

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading, isError } = useCurrentUser();

  const isAuthenticated = !!user && !isError;

  useEffect(() => {
    if (isLoading) return;

    const isDashboardRoute = pathname.startsWith("/dashboard");
    const isAuthRoute = pathname.startsWith("/auth");

    if (isDashboardRoute && !isAuthenticated) {
      router.push("/auth/v2/login");
    } else if (isAuthRoute && isAuthenticated) {
      router.push("/dashboard/default");
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (isLoading && isDashboardRoute) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-3">
        <Spinner className="size-8 text-primary" />
        <span className="text-muted-foreground text-sm font-medium animate-pulse">Verifying session...</span>
      </div>
    );
  }

  return <>{children}</>;
}
