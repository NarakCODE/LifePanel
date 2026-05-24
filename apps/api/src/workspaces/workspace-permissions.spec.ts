import { WorkspaceRole } from './schemas/workspace.schema';
import {
  getWorkspacePermissions,
  WorkspacePermission,
} from './workspace-permissions';

describe('workspace permissions', () => {
  it('grants delete/admin permissions only to owners', () => {
    const ownerPermissions = getWorkspacePermissions(WorkspaceRole.OWNER);
    const adminPermissions = getWorkspacePermissions(WorkspaceRole.ADMIN);

    expect(ownerPermissions).toContain(WorkspacePermission.WORKSPACE_DELETE);
    expect(ownerPermissions).toContain(WorkspacePermission.MEMBER_ROLE_UPDATE);
    expect(adminPermissions).not.toContain(
      WorkspacePermission.WORKSPACE_DELETE,
    );
    expect(adminPermissions).toContain(WorkspacePermission.MEMBER_ROLE_UPDATE);
  });

  it('keeps viewer permissions read-only', () => {
    const viewerPermissions = getWorkspacePermissions(WorkspaceRole.VIEWER);

    expect(viewerPermissions).toContain(WorkspacePermission.TASK_READ);
    expect(viewerPermissions).toContain(WorkspacePermission.ISSUE_READ);
    expect(viewerPermissions).toContain(WorkspacePermission.JOURNAL_READ);
    expect(viewerPermissions).not.toContain(WorkspacePermission.TASK_WRITE);
    expect(viewerPermissions).not.toContain(WorkspacePermission.ISSUE_WRITE);
    expect(viewerPermissions).not.toContain(WorkspacePermission.MEMBER_INVITE);
  });
});
