import type {
  ApiResponse,
  AuthTokensDto,
  CreateWorkspaceDto,
  InviteMemberDto,
  MeResponseDto,
  PaginationParams,
  UpdateMemberRoleDto,
  UpdateWorkspaceDto,
  Workspace,
  WorkspaceInvitation,
  WorkspaceJoinLink,
  WorkspaceJoinRequest,
  WorkspaceRequestContext,
} from "@repo/shared-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

interface RequestConfig extends RequestInit {
  params?: object;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add auth token if available
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private buildUrl(endpoint: string, params?: object): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      let errorMessage = `API Error: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && typeof errorData === "object") {
          if (typeof errorData.message === "string") {
            errorMessage = errorData.message;
          } else if (Array.isArray(errorData.message)) {
            errorMessage = errorData.message.join(", ");
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        }
      } catch {
        // Fallback to response statusText
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);

    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
      ...config,
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);

    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);

    const response = await fetch(url, {
      method: "PUT",
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);

    const response = await fetch(url, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);

    const response = await fetch(url, {
      method: "DELETE",
      headers: this.getHeaders(),
      ...config,
    });

    return this.handleResponse<T>(response);
  }
}

export const api = new ApiClient(API_URL);

// Auth API
export const authApi = {
  login: (email: string, password: string) => api.post<AuthTokensDto>("/auth/login", { email, password }),

  register: (email: string, password: string, displayName: string) =>
    api.post<{ message: string }>("/auth/register", { email, password, displayName }),

  verifyEmail: (email: string, code: string) => api.post<{ message: string }>("/auth/verify-email", { email, code }),

  resendVerification: (email: string) => api.post<{ message: string }>("/auth/resend-verification", { email }),

  logout: () => api.post<{ message: string }>("/auth/logout"),

  getMe: () => api.get<MeResponseDto>("/auth/me"),
};

// Projects API
export const projectsApi = {
  getAll: (params?: PaginationParams) => api.get("/projects", { params }),

  getById: (id: string) => api.get(`/projects/${id}`),

  create: (data: { name: string; description?: string }) => api.post("/projects", data),

  update: (id: string, data: Partial<{ name: string; description: string; status: string }>) =>
    api.patch(`/projects/${id}`, data),

  delete: (id: string) => api.delete(`/projects/${id}`),
};

// Issues API
export const issuesApi = {
  getAll: (params?: PaginationParams & { projectId?: string }) => api.get("/issues", { params }),

  getById: (id: string) => api.get(`/issues/${id}`),

  create: (data: { title: string; projectId: string; priority?: string }) => api.post("/issues", data),

  update: (id: string, data: Partial<{ title: string; status: string; priority: string; assigneeId: string }>) =>
    api.patch(`/issues/${id}`, data),

  delete: (id: string) => api.delete(`/issues/${id}`),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: PaginationParams) => api.get("/notifications", { params }),

  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),

  markAllAsRead: () => api.patch("/notifications/read-all"),

  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get("/dashboard/stats"),
};

// Workspaces API
export const workspacesApi = {
  create: (data: CreateWorkspaceDto) => api.post<Workspace>("/workspaces", data),

  findAll: () => api.get<Workspace[]>("/workspaces"),

  findOne: (id: string) => api.get<Workspace>(`/workspaces/${id}`),

  update: (id: string, data: UpdateWorkspaceDto) => api.patch<Workspace>(`/workspaces/${id}`, data),

  delete: (id: string) => api.delete(`/workspaces/${id}`),

  listMembers: (workspaceId: string) => api.get(`/workspaces/${workspaceId}/members`),

  updateMemberRole: (workspaceId: string, memberId: string, data: UpdateMemberRoleDto) =>
    api.patch(`/workspaces/${workspaceId}/members/${memberId}`, data),

  removeMember: (workspaceId: string, memberId: string) => api.delete(`/workspaces/${workspaceId}/members/${memberId}`),

  switchWorkspace: (workspaceId: string) => api.post(`/workspaces/${workspaceId}/switch`),

  leaveWorkspace: (workspaceId: string) => api.post(`/workspaces/${workspaceId}/leave`),

  resolveContext: (workspaceId?: string) =>
    api.get<WorkspaceRequestContext>("/workspaces/resolve-context", {
      params: workspaceId ? { workspaceId } : undefined,
    }),

  // Invitations
  listMyInvitations: () => api.get<WorkspaceInvitation[]>("/workspaces/invitations/mine"),

  inviteMember: (workspaceId: string, data: InviteMemberDto) =>
    api.post<WorkspaceInvitation>(`/workspaces/${workspaceId}/invitations`, data),

  listWorkspaceInvitations: (workspaceId: string) =>
    api.get<WorkspaceInvitation[]>(`/workspaces/${workspaceId}/invitations`),

  revokeInvitation: (workspaceId: string, invitationId: string) =>
    api.delete<WorkspaceInvitation>(`/workspaces/${workspaceId}/invitations/${invitationId}`),

  acceptInvitation: (invitationId: string) => api.post(`/invitations/${invitationId}/accept`),

  rejectInvitation: (invitationId: string) => api.post(`/invitations/${invitationId}/reject`),

  // Join Links
  getJoinLink: (workspaceId: string) => api.get<WorkspaceJoinLink>(`/workspaces/${workspaceId}/join-link`),

  generateJoinLink: (workspaceId: string) => api.post<WorkspaceJoinLink>(`/workspaces/${workspaceId}/join-link`),

  deleteJoinLink: (workspaceId: string) => api.delete(`/workspaces/${workspaceId}/join-link`),

  toggleJoinLink: (workspaceId: string, isEnabled: boolean) =>
    api.patch<WorkspaceJoinLink>(`/workspaces/${workspaceId}/join-link`, { isEnabled }),

  // Join Requests
  resolveJoinLink: (token: string) => api.get(`/workspaces/join/${token}`),

  createJoinRequest: (token: string) => api.post(`/workspaces/join/${token}/request`),

  listJoinRequests: (workspaceId: string) =>
    api.get<WorkspaceJoinRequest[]>(`/workspaces/${workspaceId}/join-requests`),

  approveJoinRequest: (workspaceId: string, requestId: string) =>
    api.post(`/workspaces/${workspaceId}/join-requests/${requestId}/approve`),

  rejectJoinRequest: (workspaceId: string, requestId: string) =>
    api.post(`/workspaces/${workspaceId}/join-requests/${requestId}/reject`),
};

export default api;
