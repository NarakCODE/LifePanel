"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";

interface QueryErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface QueryErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class QueryErrorBoundaryClass extends Component<
  { children: ReactNode; fallback?: ReactNode; onErrorReset?: () => void },
  QueryErrorBoundaryState
> {
  constructor(props: QueryErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): QueryErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("QueryErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onErrorReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border p-8 text-center">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Something went wrong</h3>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
          </div>
          <Button onClick={this.handleReset} variant="outline">
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function QueryErrorBoundary({ children, fallback }: QueryErrorBoundaryProps) {
  const queryClient = useQueryClient();

  return (
    <QueryErrorBoundaryClass
      fallback={fallback}
      onErrorReset={() => {
        queryClient.resetQueries();
      }}
    >
      {children}
    </QueryErrorBoundaryClass>
  );
}
