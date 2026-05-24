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
  avatar?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface IdentityDto {
  id: string;
  email: string;
  roles: string[];
  isEmailVerified: boolean;
}

export interface ProfileDto {
  displayName: string;
  avatarUrl?: string | null;
  profileMetadata?: Record<string, string>;
}

export interface AccountMetadataOnboarding {
  completedSteps: string[];
  skippedSteps: string[];
  currentStep?: string | null;
  onboardingCompleted: boolean;
}

export interface AccountMetadataDto {
  status: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string | null;
  defaultWorkspaceId?: string | null;
  activeWorkspaceId?: string | null;
  onboarding: AccountMetadataOnboarding;
}

export interface MeResponseDto {
  identity: IdentityDto;
  profile: ProfileDto;
  metadata: AccountMetadataDto;
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

// Workspace types
export enum WorkspaceType {
  SOLO = "solo",
  COLLABORATIVE = "collaborative",
}

export enum WorkspaceStatus {
  ACTIVE = "active",
  ARCHIVED = "archived",
}

export enum WorkspaceRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
}

export enum InvitationStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  REVOKED = "revoked",
}

export enum JoinRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum WorkspaceMembershipStatus {
  ACTIVE = "active",
  LEFT = "left",
  SUSPENDED = "suspended",
}

export interface WorkspaceUserDetails {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface WorkspaceMember {
  userId: string;
  role: WorkspaceRole;
  user: WorkspaceUserDetails;
}

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  status: WorkspaceStatus;
  ownerId: string;
  owner: WorkspaceUserDetails;
  createdById: string;
  createdBy: WorkspaceUserDetails;
  defaultForUserId: string | null;
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  invitedBy: string;
  role: WorkspaceRole;
  status: InvitationStatus;
  token: string;
  expiresAt: string;
  acceptedBy?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceJoinLink {
  token: string;
  isEnabled: boolean;
  workspaceId: string;
  workspaceName: string;
}

export interface WorkspaceJoinRequest {
  id: string;
  workspaceId: string;
  status: JoinRequestStatus;
  createdAt: string;
  user: WorkspaceUserDetails;
}

export interface WorkspaceRequestContext {
  workspaceId: string;
  actorUserId: string;
  role: WorkspaceRole;
  membershipStatus: WorkspaceMembershipStatus;
  permissions: string[];
  workspaceName: string;
  workspaceType: WorkspaceType;
  defaultWorkspaceId?: string | null;
  activeWorkspaceId?: string | null;
}

export interface CreateWorkspaceDto {
  name: string;
}

export interface UpdateWorkspaceDto {
  name?: string;
}

export interface InviteMemberDto {
  email: string;
  role: WorkspaceRole;
}

export interface UpdateMemberRoleDto {
  role: WorkspaceRole;
}
