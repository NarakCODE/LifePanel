import { WorkspaceRole, WorkspaceType } from '../schemas/workspace.schema';
import { WorkspaceMembershipStatus } from '../schemas/workspace-membership.schema';
import { WorkspacePermission } from '../workspace-permissions';

export interface WorkspaceRequestContext {
  workspaceId: string;
  actorUserId: string;
  role: WorkspaceRole;
  membershipStatus: WorkspaceMembershipStatus;
  permissions: WorkspacePermission[];
  workspaceName: string;
  workspaceType: WorkspaceType;
  defaultWorkspaceId?: string | null;
  activeWorkspaceId?: string | null;
}
