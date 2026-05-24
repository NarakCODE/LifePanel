import { Types } from 'mongoose';
import { WorkspaceProvisioningService } from './workspace-provisioning.service';
import {
  WorkspaceRole,
  WorkspaceStatus,
  WorkspaceType,
} from './schemas/workspace.schema';
import { WorkspaceMembershipStatus } from './schemas/workspace-membership.schema';

type MockExec<T> = { exec: jest.Mock<Promise<T>, []> };

function execMock<T>(value: Promise<T>): MockExec<T> {
  return {
    exec: jest.fn().mockReturnValue(value),
  };
}

describe('WorkspaceProvisioningService', () => {
  it('re-reads the default workspace when concurrent bootstrap hits a duplicate key', async () => {
    const userId = new Types.ObjectId();
    const workspaceId = new Types.ObjectId();
    const createdAt = new Date('2026-03-22T00:00:00.000Z');

    const user = {
      _id: userId,
      displayName: 'Narak',
      defaultWorkspaceId: null,
      activeWorkspaceId: null,
    };

    const workspace = {
      _id: workspaceId,
      createdAt,
    };

    const workspaceModel = {
      findById: jest.fn(),
      findOne: jest
        .fn()
        .mockReturnValueOnce(execMock(Promise.resolve(null)))
        .mockReturnValueOnce(execMock(Promise.resolve(workspace))),
      create: jest.fn().mockRejectedValue({ code: 11000 }),
    };

    const membership = {
      _id: new Types.ObjectId(),
      workspaceId,
      userId,
      role: WorkspaceRole.OWNER,
      status: WorkspaceMembershipStatus.ACTIVE,
    };

    const membershipModel = {
      findOneAndUpdate: jest
        .fn()
        .mockReturnValue(execMock(Promise.resolve(membership))),
    };

    const usersService = {
      findById: jest.fn().mockResolvedValue(user),
      updateWorkspacePreferences: jest.fn().mockResolvedValue(undefined),
    };

    const service = new WorkspaceProvisioningService(
      workspaceModel as never,
      membershipModel as never,
      usersService as never,
    );

    const result = await service.ensureDefaultWorkspaceForUser(
      userId.toString(),
    );

    expect(result).toBe(workspace);
    expect(workspaceModel.create).toHaveBeenCalledWith({
      name: "Narak's Workspace",
      ownerId: userId,
      createdBy: userId,
      type: WorkspaceType.SOLO,
      status: WorkspaceStatus.ACTIVE,
      defaultForUserId: userId,
      members: [{ userId, role: WorkspaceRole.OWNER }],
    });
    expect(usersService.updateWorkspacePreferences).toHaveBeenCalledWith(
      userId,
      {
        defaultWorkspaceId: workspaceId,
        activeWorkspaceId: workspaceId,
      },
    );
  });
});
