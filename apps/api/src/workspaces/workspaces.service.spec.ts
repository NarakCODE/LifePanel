import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { UserStatus } from '../users/schemas/user.schema';
import { WorkspacesService } from './workspaces.service';
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

describe('WorkspacesService', () => {
  it('delegates default workspace provisioning to WorkspaceProvisioningService', async () => {
    const userId = new Types.ObjectId().toString();
    const workspace = {
      _id: new Types.ObjectId(),
      createdAt: new Date('2026-03-22T00:00:00.000Z'),
    };
    const workspaceProvisioningService = {
      ensureDefaultWorkspaceForUser: jest.fn().mockResolvedValue(workspace),
    };

    const service = new WorkspacesService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as UsersService,
      workspaceProvisioningService as never,
    );

    await expect(service.ensureDefaultWorkspaceForUser(userId)).resolves.toBe(
      workspace,
    );
    expect(
      workspaceProvisioningService.ensureDefaultWorkspaceForUser,
    ).toHaveBeenCalledWith(userId);
  });

  it('lists user workspaces without implicitly provisioning a default workspace', async () => {
    const userId = new Types.ObjectId().toString();
    const membershipModel = {
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue(execMock(Promise.resolve([]))),
      }),
    };
    const workspaceProvisioningService = {
      ensureDefaultWorkspaceForUser: jest.fn(),
    };

    const service = new WorkspacesService(
      {} as never,
      {} as never,
      membershipModel as never,
      {} as never,
      {} as UsersService,
      workspaceProvisioningService as never,
    );

    await expect(service.findAllForUser(userId)).resolves.toEqual([]);
    expect(
      workspaceProvisioningService.ensureDefaultWorkspaceForUser,
    ).not.toHaveBeenCalled();
  });

  it('rejects access resolution when the user has not completed workspace setup', async () => {
    const userId = new Types.ObjectId().toString();
    const workspaceProvisioningService = {
      ensureDefaultWorkspaceForUser: jest.fn(),
    };

    const service = new WorkspacesService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        findById: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(userId),
          defaultWorkspaceId: null,
          activeWorkspaceId: null,
        }),
      } as never,
      workspaceProvisioningService as never,
    );

    await expect(service.resolveAccessContext(userId)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(
      workspaceProvisioningService.ensureDefaultWorkspaceForUser,
    ).not.toHaveBeenCalled();
  });

  it('returns the existing membership after a duplicate-key race during upsert', async () => {
    const workspaceId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const existingMembership = {
      _id: new Types.ObjectId(),
      workspaceId,
      userId,
      role: WorkspaceRole.OWNER,
      status: WorkspaceMembershipStatus.ACTIVE,
    };

    const membershipModel = {
      findOneAndUpdate: jest
        .fn()
        .mockReturnValue(execMock(Promise.reject({ code: 11000 }))),
      findOne: jest
        .fn()
        .mockReturnValue(execMock(Promise.resolve(existingMembership))),
    };

    const service = new WorkspacesService(
      {} as never,
      {} as never,
      membershipModel as never,
      {} as never,
      {} as UsersService,
      {} as never,
    );

    const result = await (
      service as unknown as {
        upsertMembership: (
          workspaceId: Types.ObjectId,
          userId: Types.ObjectId,
          role: WorkspaceRole,
        ) => Promise<typeof existingMembership>;
      }
    ).upsertMembership(workspaceId, userId, WorkspaceRole.OWNER);

    expect(result).toBe(existingMembership);
    expect(membershipModel.findOne).toHaveBeenCalledWith({
      workspaceId,
      userId,
    });
  });

  it('rejects inviteMember with an invalid workspace id instead of throwing a 500', async () => {
    const service = new WorkspacesService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as UsersService,
      {} as never,
    );

    await expect(
      service.inviteMember(
        'invalid-workspace-id',
        new Types.ObjectId().toString(),
        {
          email: 'invitee@example.com',
          role: WorkspaceRole.MEMBER,
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects acceptInvitation with an invalid invitation id instead of throwing a 500', async () => {
    const service = new WorkspacesService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as UsersService,
      {} as never,
    );

    await expect(
      service.acceptInvitation(
        'invalid-invitation-id',
        new Types.ObjectId().toString(),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('retires an expired pending invitation before creating a replacement', async () => {
    const workspaceId = new Types.ObjectId();
    const inviterId = new Types.ObjectId();
    const expiredInvitation = {
      _id: new Types.ObjectId(),
      workspaceId,
      email: 'invitee@example.com',
      role: WorkspaceRole.MEMBER,
      status: 'pending',
      expiresAt: new Date('2026-03-21T00:00:00.000Z'),
      respondedAt: null,
      save: jest.fn().mockResolvedValue(undefined),
    };

    const createdInvitation = {
      _id: new Types.ObjectId(),
      workspaceId,
      email: 'invitee@example.com',
      invitedBy: inviterId,
      role: WorkspaceRole.MEMBER,
      status: 'pending',
      token: 'token-123',
      expiresAt: new Date('2026-03-29T00:00:00.000Z'),
      acceptedBy: null,
      respondedAt: null,
      createdAt: new Date('2026-03-22T00:00:00.000Z'),
      updatedAt: new Date('2026-03-22T00:00:00.000Z'),
    };

    const invitationModel = Object.assign(
      jest.fn().mockImplementation((payload) => ({
        ...payload,
        save: jest.fn().mockResolvedValue(createdInvitation),
      })),
      {
        findOne: jest
          .fn()
          .mockReturnValue(execMock(Promise.resolve(expiredInvitation))),
      },
    );

    const service = new WorkspacesService(
      {} as never,
      invitationModel as never,
      {
        findOne: jest.fn().mockReturnValue(execMock(Promise.resolve(null))),
      } as never,
      {} as never,
      {
        findById: jest.fn(),
        findByEmail: jest.fn().mockResolvedValue(null),
      } as never,
      {} as never,
    );

    const result = await service.inviteMember(
      workspaceId.toString(),
      inviterId.toString(),
      {
        email: 'invitee@example.com',
        role: WorkspaceRole.MEMBER,
      },
    );

    expect(expiredInvitation.status).toBe('rejected');
    expect(expiredInvitation.respondedAt).toBeInstanceOf(Date);
    expect(expiredInvitation.save).toHaveBeenCalled();
    expect(invitationModel).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId,
        email: 'invitee@example.com',
        invitedBy: inviterId,
        role: WorkspaceRole.MEMBER,
      }),
    );
    expect(result).toEqual({
      id: createdInvitation._id.toString(),
      workspaceId: workspaceId.toString(),
      email: 'invitee@example.com',
      invitedBy: inviterId.toString(),
      role: WorkspaceRole.MEMBER,
      status: 'pending',
      token: 'token-123',
      expiresAt: new Date('2026-03-29T00:00:00.000Z'),
      acceptedBy: null,
      respondedAt: null,
      createdAt: new Date('2026-03-22T00:00:00.000Z'),
      updatedAt: new Date('2026-03-22T00:00:00.000Z'),
    });
  });

  it('lists pending workspace invitations as serialized responses', async () => {
    const workspaceId = new Types.ObjectId();
    const inviterId = new Types.ObjectId();
    const invitation = {
      _id: new Types.ObjectId(),
      workspaceId,
      email: 'invitee@example.com',
      invitedBy: inviterId,
      role: WorkspaceRole.ADMIN,
      status: 'pending',
      token: 'token-123',
      expiresAt: new Date('2026-03-29T00:00:00.000Z'),
      acceptedBy: null,
      respondedAt: null,
      createdAt: new Date('2026-03-22T00:00:00.000Z'),
      updatedAt: new Date('2026-03-22T00:00:00.000Z'),
    };

    const invitationModel = {
      find: jest.fn().mockReturnValue({
        sort: jest
          .fn()
          .mockReturnValue(execMock(Promise.resolve([invitation]))),
      }),
    };

    const service = new WorkspacesService(
      {} as never,
      invitationModel as never,
      {} as never,
      {} as never,
      {} as UsersService,
      {} as never,
    );

    await expect(
      service.listWorkspaceInvitations(workspaceId.toString()),
    ).resolves.toEqual([
      {
        id: invitation._id.toString(),
        workspaceId: workspaceId.toString(),
        email: 'invitee@example.com',
        invitedBy: inviterId.toString(),
        role: WorkspaceRole.ADMIN,
        status: 'pending',
        token: 'token-123',
        expiresAt: new Date('2026-03-29T00:00:00.000Z'),
        acceptedBy: null,
        respondedAt: null,
        createdAt: new Date('2026-03-22T00:00:00.000Z'),
        updatedAt: new Date('2026-03-22T00:00:00.000Z'),
      },
    ]);
    expect(invitationModel.find).toHaveBeenCalledWith({
      workspaceId,
      status: 'pending',
    });
  });

  it('lists only active, non-deleted workspace members', async () => {
    const workspaceId = new Types.ObjectId();
    const ownerId = new Types.ObjectId();
    const activeMemberId = new Types.ObjectId();
    const leftMemberId = new Types.ObjectId();
    const deletedMemberId = new Types.ObjectId();
    const now = new Date('2026-03-22T00:00:00.000Z');
    const workspace = {
      _id: workspaceId,
      name: 'Team Workspace',
      type: WorkspaceType.COLLABORATIVE,
      status: WorkspaceStatus.ACTIVE,
      ownerId,
      createdBy: ownerId,
      defaultForUserId: null,
      members: [
        { userId: activeMemberId, role: WorkspaceRole.MEMBER },
        { userId: leftMemberId, role: WorkspaceRole.ADMIN },
        { userId: deletedMemberId, role: WorkspaceRole.VIEWER },
      ],
      createdAt: now,
      updatedAt: now,
    };
    const memberships = [
      {
        workspaceId,
        userId: activeMemberId,
        role: WorkspaceRole.MEMBER,
        status: WorkspaceMembershipStatus.ACTIVE,
      },
      {
        workspaceId,
        userId: leftMemberId,
        role: WorkspaceRole.ADMIN,
        status: WorkspaceMembershipStatus.LEFT,
      },
      {
        workspaceId,
        userId: deletedMemberId,
        role: WorkspaceRole.VIEWER,
        status: WorkspaceMembershipStatus.ACTIVE,
      },
    ];
    const workspaceModel = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue(execMock(Promise.resolve(workspace))),
      }),
    };
    const membershipModel = {
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue(execMock(Promise.resolve(memberships))),
      }),
    };
    const usersService = {
      findByIds: jest.fn().mockResolvedValue([
        {
          _id: ownerId,
          email: 'owner@example.com',
          displayName: 'Owner',
          status: UserStatus.ACTIVE,
          avatarUrl: null,
        },
        {
          _id: activeMemberId,
          email: 'member@example.com',
          displayName: 'Active Member',
          status: UserStatus.ACTIVE,
          avatarUrl: null,
        },
        {
          _id: deletedMemberId,
          email: 'deleted@example.com',
          displayName: 'Deleted Member',
          status: UserStatus.DELETED,
          avatarUrl: null,
        },
      ]),
    };

    const service = new WorkspacesService(
      workspaceModel as never,
      {} as never,
      membershipModel as never,
      {} as never,
      usersService as never,
      {} as never,
    );

    await expect(service.listMembers(workspaceId.toString())).resolves.toEqual([
      {
        userId: activeMemberId.toString(),
        role: WorkspaceRole.MEMBER,
        user: {
          id: activeMemberId.toString(),
          email: 'member@example.com',
          displayName: 'Active Member',
          avatarUrl: null,
        },
      },
    ]);
    expect(membershipModel.find).toHaveBeenCalledWith({
      workspaceId: { $in: [workspaceId] },
    });
  });
});
