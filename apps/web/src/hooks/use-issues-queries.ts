"use client";

import type { Issue, PaginationParams } from "@repo/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { issuesApi } from "@/lib/api-client";
import { issuesKeys } from "@/lib/query-keys";

export function useIssues(params?: PaginationParams & { projectId?: string }) {
  return useQuery({
    queryKey: issuesKeys.list((params ?? {}) as Record<string, string | number | boolean | undefined>),
    queryFn: async () => {
      const response = await issuesApi.getAll(params);
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch issues");
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 1,
  });
}

export function useIssue(id: string) {
  return useQuery({
    queryKey: issuesKeys.detail(id),
    queryFn: async () => {
      const response = await issuesApi.getById(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch issue");
      }
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; projectId: string; priority?: string }) => {
      const response = await issuesApi.create(data);
      if (!response.success) {
        throw new Error(response.message || "Failed to create issue");
      }
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: issuesKeys.lists() });
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: issuesKeys.list({ projectId: variables.projectId }),
        });
      }
      toast.success("Issue created", {
        description: "Your issue has been created successfully",
      });
    },
  });
}

export function useUpdateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{ title: string; status: string; priority: string; assigneeId: string }>;
    }) => {
      const response = await issuesApi.update(id, data);
      if (!response.success) {
        throw new Error(response.message || "Failed to update issue");
      }
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: issuesKeys.detail(id) });
      const previousIssue = queryClient.getQueryData<Issue>(issuesKeys.detail(id));

      if (previousIssue) {
        queryClient.setQueryData(issuesKeys.detail(id), {
          ...previousIssue,
          ...data,
        });
      }

      return { previousIssue };
    },
    onError: (_err, { id }) => {
      queryClient.invalidateQueries({ queryKey: issuesKeys.detail(id) });
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: issuesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: issuesKeys.lists() });
      toast.success("Issue updated", {
        description: "Your issue has been updated successfully",
      });
    },
  });
}

export function useDeleteIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await issuesApi.delete(id);
      if (!response.success) {
        throw new Error(response.message || "Failed to delete issue");
      }
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: issuesKeys.lists() });
      queryClient.removeQueries({ queryKey: issuesKeys.detail(id) });
      toast.success("Issue deleted", {
        description: "Your issue has been deleted successfully",
      });
    },
  });
}
