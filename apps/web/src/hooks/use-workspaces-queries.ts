"use client";

import type {
  CreateWorkspaceDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
  UpdateWorkspaceDto,
  Workspace,
  WorkspaceInvitation,
  WorkspaceJoinLink,
  WorkspaceJoinRequest,
  WorkspaceMember,
  WorkspaceRequestContext,
} from "@repo/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { workspacesApi } from "@/lib/api-client";
import { workspacesKeys } from "@/lib/query-keys";

export function useWorkspaces() {
  return useQuery({
    queryKey: workspacesKeys.lists(),
    queryFn: async () => {
      const response = await workspacesApi.findAll();
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch workspaces");
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: workspacesKeys.detail(id),
    queryFn: async () => {
      const response = await workspacesApi.findOne(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch workspace");
      }
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWorkspaceDto) => {
      const response = await workspacesApi.create(data);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to create workspace");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.lists() });
      toast.success("Workspace created", {
        description: "Your workspace has been created successfully",
      });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateWorkspaceDto }) => {
      const response = await workspacesApi.update(id, data);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to update workspace");
      }
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: workspacesKeys.detail(id) });
      const previousWorkspace = queryClient.getQueryData<Workspace>(workspacesKeys.detail(id));

      if (previousWorkspace) {
        queryClient.setQueryData(workspacesKeys.detail(id), {
          ...previousWorkspace,
          ...data,
        });
      }

      return { previousWorkspace };
    },
    onError: (_err, { id }) => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.detail(id) });
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: workspacesKeys.lists() });
      toast.success("Workspace updated", {
        description: "Your workspace has been updated successfully",
      });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await workspacesApi.delete(id);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.lists() });
      queryClient.removeQueries({ queryKey: workspacesKeys.detail(id) });
      queryClient.removeQueries({ queryKey: workspacesKeys.members(id) });
      toast.success("Workspace deleted", {
        description: "Your workspace has been deleted successfully",
      });
    },
  });
}

export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: workspacesKeys.members(workspaceId),
    queryFn: async () => {
      const response = await workspacesApi.listMembers(workspaceId);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch members");
      }
      return response.data as WorkspaceMember[];
    },
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      memberId,
      data,
    }: {
      workspaceId: string;
      memberId: string;
      data: UpdateMemberRoleDto;
    }) => {
      const response = await workspacesApi.updateMemberRole(workspaceId, memberId, data);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to update member role");
      }
      return response.data;
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspacesKeys.detail(workspaceId) });
      toast.success("Member role updated", {
        description: "The member role has been updated successfully",
      });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, memberId }: { workspaceId: string; memberId: string }) => {
      await workspacesApi.removeMember(workspaceId, memberId);
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspacesKeys.detail(workspaceId) });
      toast.success("Member removed", {
        description: "The member has been removed from the workspace",
      });
    },
  });
}

export function useSwitchWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const response = await workspacesApi.switchWorkspace(workspaceId);
      if (!response.success) {
        throw new Error(response.message || "Failed to switch workspace");
      }
      return workspaceId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.context() });
      toast.success("Workspace switched", {
        description: "Your active workspace has been updated",
      });
    },
  });
}

export function useLeaveWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const response = await workspacesApi.leaveWorkspace(workspaceId);
      if (!response.success) {
        throw new Error(response.message || "Failed to leave workspace");
      }
      return workspaceId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspacesKeys.context() });
      toast.success("Left workspace", {
        description: "You have left the workspace successfully",
      });
    },
  });
}

export function useWorkspaceContext(workspaceId?: string) {
  return useQuery({
    queryKey: workspacesKeys.context(),
    queryFn: async () => {
      const response = await workspacesApi.resolveContext(workspaceId);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to resolve workspace context");
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useMyInvitations() {
  return useQuery({
    queryKey: workspacesKeys.invitations.mine(),
    queryFn: async () => {
      const response = await workspacesApi.listMyInvitations();
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch invitations");
      }
      return response.data;
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, data }: { workspaceId: string; data: InviteMemberDto }) => {
      const response = await workspacesApi.inviteMember(workspaceId, data);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to invite member");
      }
      return response.data;
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.invitations.workspace(workspaceId) });
      toast.success("Invitation sent", {
        description: "The invitation has been sent successfully",
      });
    },
  });
}

export function useWorkspaceInvitations(workspaceId: string) {
  return useQuery({
    queryKey: workspacesKeys.invitations.workspace(workspaceId),
    queryFn: async () => {
      const response = await workspacesApi.listWorkspaceInvitations(workspaceId);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch invitations");
      }
      return response.data;
    },
    enabled: !!workspaceId,
    staleTime: 1000 * 30,
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, invitationId }: { workspaceId: string; invitationId: string }) => {
      const response = await workspacesApi.revokeInvitation(workspaceId, invitationId);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to revoke invitation");
      }
      return response.data;
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.invitations.workspace(workspaceId) });
      toast.success("Invitation revoked", {
        description: "The invitation has been revoked successfully",
      });
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await workspacesApi.acceptInvitation(invitationId);
      if (!response.success) {
        throw new Error(response.message || "Failed to accept invitation");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.invitations.mine() });
      queryClient.invalidateQueries({ queryKey: workspacesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspacesKeys.context() });
      toast.success("Invitation accepted", {
        description: "You have joined the workspace successfully",
      });
    },
  });
}

export function useRejectInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await workspacesApi.rejectInvitation(invitationId);
      if (!response.success) {
        throw new Error(response.message || "Failed to reject invitation");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.invitations.mine() });
      toast.success("Invitation rejected", {
        description: "The invitation has been rejected",
      });
    },
  });
}

export function useJoinLink(workspaceId: string) {
  return useQuery({
    queryKey: workspacesKeys.joinLinks.workspace(workspaceId),
    queryFn: async () => {
      const response = await workspacesApi.getJoinLink(workspaceId);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch join link");
      }
      return response.data;
    },
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGenerateJoinLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const response = await workspacesApi.generateJoinLink(workspaceId);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to generate join link");
      }
      return response.data;
    },
    onSuccess: (_data, workspaceId) => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.joinLinks.workspace(workspaceId) });
      toast.success("Join link generated", {
        description: "A new join link has been created",
      });
    },
  });
}

export function useDeleteJoinLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workspaceId: string) => {
      await workspacesApi.deleteJoinLink(workspaceId);
    },
    onSuccess: (_data, workspaceId) => {
      queryClient.removeQueries({ queryKey: workspacesKeys.joinLinks.workspace(workspaceId) });
      toast.success("Join link deleted", {
        description: "The join link has been deleted",
      });
    },
  });
}

export function useToggleJoinLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, isEnabled }: { workspaceId: string; isEnabled: boolean }) => {
      const response = await workspacesApi.toggleJoinLink(workspaceId, isEnabled);
      if (!response.success) {
        throw new Error(response.message || "Failed to toggle join link");
      }
      return response.data;
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.joinLinks.workspace(workspaceId) });
      toast.success("Join link updated", {
        description: "The join link status has been updated",
      });
    },
  });
}

export function useResolveJoinLink(token: string) {
  return useQuery({
    queryKey: workspacesKeys.joinToken(token),
    queryFn: async () => {
      const response = await workspacesApi.resolveJoinLink(token);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Invalid or expired join link");
      }
      return response.data;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateJoinRequest() {
  return useMutation({
    mutationFn: async (token: string) => {
      const response = await workspacesApi.createJoinRequest(token);
      if (!response.success) {
        throw new Error(response.message || "Failed to create join request");
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success("Join request sent", {
        description: "Your request to join the workspace has been sent",
      });
    },
  });
}

export function useJoinRequests(workspaceId: string) {
  return useQuery({
    queryKey: workspacesKeys.joinRequests.workspace(workspaceId),
    queryFn: async () => {
      const response = await workspacesApi.listJoinRequests(workspaceId);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch join requests");
      }
      return response.data;
    },
    enabled: !!workspaceId,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

export function useApproveJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, requestId }: { workspaceId: string; requestId: string }) => {
      const response = await workspacesApi.approveJoinRequest(workspaceId, requestId);
      if (!response.success) {
        throw new Error(response.message || "Failed to approve join request");
      }
      return response.data;
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.joinRequests.workspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspacesKeys.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspacesKeys.detail(workspaceId) });
      toast.success("Join request approved", {
        description: "The user has been added to the workspace",
      });
    },
  });
}

export function useRejectJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, requestId }: { workspaceId: string; requestId: string }) => {
      const response = await workspacesApi.rejectJoinRequest(workspaceId, requestId);
      if (!response.success) {
        throw new Error(response.message || "Failed to reject join request");
      }
      return response.data;
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.joinRequests.workspace(workspaceId) });
      toast.success("Join request rejected", {
        description: "The join request has been rejected",
      });
    },
  });
}
