"use client";

import type { Notification, PaginationParams } from "@repo/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { notificationsApi } from "@/lib/api-client";
import { notificationsKeys } from "@/lib/query-keys";

export function useNotifications(params?: PaginationParams) {
  return useQuery({
    queryKey: notificationsKeys.list((params ?? {}) as Record<string, string | number | boolean | undefined>),
    queryFn: async () => {
      const response = await notificationsApi.getAll(params);
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch notifications");
      }
      return response.data;
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await notificationsApi.markAsRead(id);
      if (!response.success) {
        throw new Error(response.message || "Failed to mark notification as read");
      }
      return response.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationsKeys.lists() });
      const previousNotifications = queryClient.getQueryData<Notification[]>(notificationsKeys.lists());

      if (previousNotifications) {
        const updatedNotifications = previousNotifications.map((n) => (n.id === id ? { ...n, read: true } : n));
        queryClient.setQueryData(notificationsKeys.lists(), updatedNotifications);
      }

      return { previousNotifications };
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.lists() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.lists() });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await notificationsApi.markAllAsRead();
      if (!response.success) {
        throw new Error(response.message || "Failed to mark all as read");
      }
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationsKeys.lists() });
      const previousNotifications = queryClient.getQueryData<Notification[]>(notificationsKeys.lists());

      if (previousNotifications) {
        const updatedNotifications = previousNotifications.map((n) => ({
          ...n,
          read: true,
        }));
        queryClient.setQueryData(notificationsKeys.lists(), updatedNotifications);
      }

      return { previousNotifications };
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.lists() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.lists() });
      toast.success("All notifications marked as read");
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await notificationsApi.delete(id);
      if (!response.success) {
        throw new Error(response.message || "Failed to delete notification");
      }
      return response.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationsKeys.lists() });
      const previousNotifications = queryClient.getQueryData<Notification[]>(notificationsKeys.lists());

      if (previousNotifications) {
        const filteredNotifications = previousNotifications.filter((n) => n.id !== id);
        queryClient.setQueryData(notificationsKeys.lists(), filteredNotifications);
      }

      return { previousNotifications };
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.lists() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.lists() });
      toast.success("Notification deleted");
    },
  });
}
