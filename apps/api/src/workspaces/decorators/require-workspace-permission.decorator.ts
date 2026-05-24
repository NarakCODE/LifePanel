import { SetMetadata } from '@nestjs/common';
import { WorkspacePermission } from '../workspace-permissions';

export const WORKSPACE_PERMISSION_KEY = 'workspace_permission';

export const RequireWorkspacePermission = (permission: WorkspacePermission) =>
  SetMetadata(WORKSPACE_PERMISSION_KEY, permission);
