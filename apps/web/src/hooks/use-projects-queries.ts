"use client";

import type { PaginationParams, Project } from "@repo/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { projectsApi } from "@/lib/api-client";
import { projectsKeys } from "@/lib/query-keys";

export function useProjects(params?: PaginationParams) {
  return useQuery({
    queryKey: projectsKeys.list((params ?? {}) as Record<string, string | number | boolean | undefined>),
    queryFn: async () => {
      const response = await projectsApi.getAll(params);
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch projects");
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectsKeys.detail(id),
    queryFn: async () => {
      const response = await projectsApi.getById(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch project");
      }
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await projectsApi.create(data);
      if (!response.success) {
        throw new Error(response.message || "Failed to create project");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() });
      toast.success("Project created", {
        description: "Your project has been created successfully",
      });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{ name: string; description: string; status: string }>;
    }) => {
      const response = await projectsApi.update(id, data);
      if (!response.success) {
        throw new Error(response.message || "Failed to update project");
      }
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: projectsKeys.detail(id) });
      const previousProject = queryClient.getQueryData<Project>(projectsKeys.detail(id));

      if (previousProject) {
        queryClient.setQueryData(projectsKeys.detail(id), {
          ...previousProject,
          ...data,
        });
      }

      return { previousProject };
    },
    onError: (_err, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.detail(id) });
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() });
      toast.success("Project updated", {
        description: "Your project has been updated successfully",
      });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await projectsApi.delete(id);
      if (!response.success) {
        throw new Error(response.message || "Failed to delete project");
      }
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() });
      queryClient.removeQueries({ queryKey: projectsKeys.detail(id) });
      toast.success("Project deleted", {
        description: "Your project has been deleted successfully",
      });
    },
  });
}
