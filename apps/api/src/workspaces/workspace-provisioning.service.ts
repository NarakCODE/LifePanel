import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Workspace,
  WorkspaceDocument,
  WorkspaceRole,
  WorkspaceStatus,
  WorkspaceType,
} from './schemas/workspace.schema';
import {
  WorkspaceMembership,
  WorkspaceMembershipDocument,
  WorkspaceMembershipStatus,
} from './schemas/workspace-membership.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class WorkspaceProvisioningService {
  constructor(
    @InjectModel(Workspace.name)
    private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(WorkspaceMembership.name)
    private readonly membershipModel: Model<WorkspaceMembershipDocument>,
    private readonly usersService: UsersService,
  ) {}

  async ensureDefaultWorkspaceForUser(
    userId: string,
  ): Promise<WorkspaceDocument> {
    const user = await this.usersService.findById(userId);

    if (user.defaultWorkspaceId) {
      if (!user.activeWorkspaceId) {
        await this.usersService.updateWorkspacePreferences(user._id, {
          activeWorkspaceId: user.defaultWorkspaceId,
        });
      }

      const existingWorkspace = await this.workspaceModel
        .findById(user.defaultWorkspaceId)
        .exec();
      if (existingWorkspace) {
        return existingWorkspace;
      }
    }

    let defaultWorkspace = await this.workspaceModel
      .findOne({ defaultForUserId: user._id })
      .exec();

    if (!defaultWorkspace) {
      try {
        defaultWorkspace = await this.workspaceModel.create({
          name: `My Workspace`,
          ownerId: user._id,
          createdBy: user._id,
          type: WorkspaceType.SOLO,
          status: WorkspaceStatus.ACTIVE,
          defaultForUserId: user._id,
          members: [{ userId: user._id, role: WorkspaceRole.OWNER }],
        });
      } catch (error) {
        if (!this.isDuplicateKeyError(error)) {
          throw error;
        }

        defaultWorkspace = await this.workspaceModel
          .findOne({ defaultForUserId: user._id })
          .exec();
      }
    }

    if (!defaultWorkspace) {
      throw new NotFoundException(
        'Default workspace could not be resolved for the current user',
      );
    }

    await this.upsertMembership(
      defaultWorkspace._id,
      user._id,
      WorkspaceRole.OWNER,
      {
        status: WorkspaceMembershipStatus.ACTIVE,
        joinedAt: defaultWorkspace.createdAt ?? new Date(),
        lastActiveAt: new Date(),
      },
    );

    await this.usersService.updateWorkspacePreferences(user._id, {
      defaultWorkspaceId: defaultWorkspace._id,
      activeWorkspaceId: user.activeWorkspaceId ?? defaultWorkspace._id,
    });

    return defaultWorkspace;
  }

  private async upsertMembership(
    workspaceId: Types.ObjectId,
    userId: Types.ObjectId,
    role: WorkspaceRole,
    extras?: Partial<WorkspaceMembership>,
  ): Promise<WorkspaceMembershipDocument> {
    try {
      return await this.membershipModel
        .findOneAndUpdate(
          { workspaceId, userId },
          {
            $set: {
              role,
              status: extras?.status ?? WorkspaceMembershipStatus.ACTIVE,
              invitedBy: extras?.invitedBy ?? null,
              joinedAt: extras?.joinedAt ?? new Date(),
              lastActiveAt: extras?.lastActiveAt ?? null,
            },
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
          },
        )
        .exec();
    } catch (error) {
      if (!this.isDuplicateKeyError(error)) {
        throw error;
      }

      const existingMembership = await this.membershipModel
        .findOne({ workspaceId, userId })
        .exec();

      if (!existingMembership) {
        throw error;
      }

      return existingMembership;
    }
  }

  private isDuplicateKeyError(error: unknown): error is { code: number } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    );
  }
}
