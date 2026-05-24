// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth types
export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Dashboard types
export interface DashboardStats {
  totalProjects: number;
  totalIssues: number;
  activeUsers: number;
  pendingTasks: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  projectId: string;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
