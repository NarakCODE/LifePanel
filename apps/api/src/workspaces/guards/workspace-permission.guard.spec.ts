import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspacePermissionGuard } from './workspace-permission.guard';
import { WorkspacePermission } from '../workspace-permissions';

describe('WorkspacePermissionGuard', () => {
  const getAllAndOverride = jest.fn();
  const reflector = {
    getAllAndOverride,
  } as unknown as Reflector;

  const createContext = (permissions?: WorkspacePermission[]) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          workspacePermissions: permissions,
        }),
      }),
    }) as any;

  beforeEach(() => {
    getAllAndOverride.mockReset();
  });

  it('allows requests when no workspace permission is required', () => {
    getAllAndOverride.mockReturnValue(undefined);
    const guard = new WorkspacePermissionGuard(reflector);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows requests when the required workspace permission is present', () => {
    getAllAndOverride.mockReturnValue(WorkspacePermission.MEMBER_INVITE);
    const guard = new WorkspacePermissionGuard(reflector);

    expect(
      guard.canActivate(createContext([WorkspacePermission.MEMBER_INVITE])),
    ).toBe(true);
  });

  it('rejects requests when the required workspace permission is missing', () => {
    getAllAndOverride.mockReturnValue(WorkspacePermission.MEMBER_INVITE);
    const guard = new WorkspacePermissionGuard(reflector);

    expect(() =>
      guard.canActivate(createContext([WorkspacePermission.TASK_WRITE])),
    ).toThrow(ForbiddenException);
  });
});
