import type { ApiResponse, PaginatedResponse, PaginationParams } from '@repo/shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
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

  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
      ...config,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
      ...config,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }
}

export const api = new ApiClient(API_URL);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),

  logout: () => api.post('/auth/logout'),

  getProfile: () => api.get('/auth/profile'),
};

// Projects API
export const projectsApi = {
  getAll: (params?: PaginationParams) => api.get('/projects', { params }),

  getById: (id: string) => api.get(`/projects/${id}`),

  create: (data: { name: string; description?: string }) =>
    api.post('/projects', data),

  update: (id: string, data: Partial<{ name: string; description: string; status: string }>) =>
    api.patch(`/projects/${id}`, data),

  delete: (id: string) => api.delete(`/projects/${id}`),
};

// Issues API
export const issuesApi = {
  getAll: (params?: PaginationParams & { projectId?: string }) =>
    api.get('/issues', { params }),

  getById: (id: string) => api.get(`/issues/${id}`),

  create: (data: { title: string; projectId: string; priority?: string }) =>
    api.post('/issues', data),

  update: (id: string, data: Partial<{ title: string; status: string; priority: string; assigneeId: string }>) =>
    api.patch(`/issues/${id}`, data),

  delete: (id: string) => api.delete(`/issues/${id}`),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: PaginationParams) => api.get('/notifications', { params }),

  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),

  markAllAsRead: () => api.patch('/notifications/read-all'),

  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;
