import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import {
  Workspace,
  WorkspaceDocument,
  WorkspaceRole,
  WorkspaceStatus,
  WorkspaceType,
} from './schemas/workspace.schema';
import {
  WorkspaceInvitation,
  WorkspaceInvitationDocument,
  InvitationStatus,
} from './schemas/workspace-invitation.schema';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UsersService } from '../users/users.service';
import { UserStatus } from '../users/schemas/user.schema';
import {
  WorkspaceMembership,
  WorkspaceMembershipDocument,
  WorkspaceMembershipStatus,
} from './schemas/workspace-membership.schema';
import {
  WorkspaceJoinRequest,
  WorkspaceJoinRequestDocument,
  JoinRequestStatus,
} from './schemas/workspace-join-request.schema';
import { WorkspaceRequestContext } from './interfaces/workspace-context.interface';
import { getWorkspacePermissions } from './workspace-permissions';
import { WorkspaceProvisioningService } from './workspace-provisioning.service';

// User details interface for populated responses
export interface UserDetails {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
}

// Member with populated user details
export interface WorkspaceMemberWithDetails {
  userId: string;
  role: WorkspaceRole;
  user: UserDetails;
}

// Workspace with fully populated details
export interface WorkspaceWithDetails {
  id: string;
  name: string;
  type: WorkspaceType;
  status: WorkspaceStatus;
  ownerId: string;
  owner: UserDetails;
  createdById: string;
  createdBy: UserDetails;
  defaultForUserId: string | null;
  members: WorkspaceMemberWithDetails[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceInvitationResponse {
  id: string;
  workspaceId: string;
  email: string;
  invitedBy: string;
  role: WorkspaceRole;
  status: InvitationStatus;
  token: string;
  expiresAt: Date;
  acceptedBy?: string | null;
  respondedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceJoinLinkResponse {
  token: string;
  isEnabled: boolean;
  workspaceId: string;
  workspaceName: string;
}

interface WorkspaceMemberRecord {
  userId: Types.ObjectId | string;
  role: WorkspaceRole;
}

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name)
    private workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(WorkspaceInvitation.name)
    private invitationModel: Model<WorkspaceInvitationDocument>,
    @InjectModel(WorkspaceMembership.name)
    private membershipModel: Model<WorkspaceMembershipDocument>,
    @InjectModel(WorkspaceJoinRequest.name)
    private joinRequestModel: Model<WorkspaceJoinRequestDocument>,
    private usersService: UsersService,
    private workspaceProvisioningService: WorkspaceProvisioningService,
  ) {}

  async create(
    userId: string,
    dto: CreateWorkspaceDto,
  ): Promise<WorkspaceWithDetails> {
    const user = await this.usersService.findById(userId);
    const workspace = await this.workspaceModel.create({
      name: dto.name,
      ownerId: user._id,
      createdBy: user._id,
      type: WorkspaceType.COLLABORATIVE,
      status: WorkspaceStatus.ACTIVE,
      members: [
        {
          userId: user._id,
          role: WorkspaceRole.OWNER,
        },
      ],
    });

    await this.upsertMembership(workspace._id, user._id, WorkspaceRole.OWNER, {
      status: WorkspaceMembershipStatus.ACTIVE,
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    });

    if (!user.defaultWorkspaceId) {
      await this.usersService.updateWorkspacePreferences(user._id, {
        defaultWorkspaceId: workspace._id,
      });
    }

    if (!user.activeWorkspaceId) {
      await this.usersService.updateWorkspacePreferences(user._id, {
        activeWorkspaceId: workspace._id,
      });
    }

    // Return enriched workspace with user details
    const enriched = await this.enrichWorkspacesWithUserDetails([
      workspace.toObject(),
    ]);
    return enriched[0]!;
  }

  async findAllForUser(userId: string): Promise<WorkspaceWithDetails[]> {
    const memberships = await this.membershipModel
      .find({
        userId: new Types.ObjectId(userId),
        status: WorkspaceMembershipStatus.ACTIVE,
      })
      .lean()
      .exec();

    const workspaceIds = memberships.map(
      (membership) => membership.workspaceId,
    );

    if (!workspaceIds.length) {
      return [];
    }

    const workspaces = await this.workspaceModel
      .find({
        _id: { $in: workspaceIds },
        status: WorkspaceStatus.ACTIVE,
      })
      .lean()
      .exec();

    // Enrich workspaces with full user details
    return this.enrichWorkspacesWithUserDetails(workspaces);
  }

  async findOne(id: string): Promise<WorkspaceWithDetails> {
    const workspace = await this.workspaceModel.findById(id).lean().exec();
    if (!workspace) throw new NotFoundException('Workspace not found');

    const enriched = await this.enrichWorkspacesWithUserDetails([workspace]);
    return enriched[0]!;
  }

  /**
   * Enrich workspaces with full user details for owner, createdBy, and members
   */
  private async enrichWorkspacesWithUserDetails(
    workspaces: any[],
  ): Promise<WorkspaceWithDetails[]> {
    if (!workspaces.length) return [];

    const membersByWorkspace =
      await this.resolveActiveMembersByWorkspace(workspaces);

    // Collect all unique user IDs that need to be fetched
    const userIdSet = new Set<string>();
    workspaces.forEach((workspace) => {
      userIdSet.add(workspace.ownerId.toString());
      userIdSet.add(workspace.createdBy.toString());
      const members = membersByWorkspace.get(workspace._id.toString()) ?? [];
      members.forEach((member) => {
        userIdSet.add(member.userId.toString());
      });
    });

    // Fetch all users in a single query
    const userIds = Array.from(userIdSet);
    const users = await this.usersService.findByIds(userIds);

    // Create a map for quick lookup
    const userMap = new Map<string, UserDetails>();
    users.forEach((user) => {
      if (user.status === UserStatus.DELETED) {
        return;
      }

      userMap.set(user._id.toString(), {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
      });
    });

    // Build enriched workspaces
    return workspaces.map((workspace) => {
      const ownerId = workspace.ownerId.toString();
      const createdById = workspace.createdBy.toString();
      const activeMembers =
        membersByWorkspace.get(workspace._id.toString()) ?? [];

      return {
        id: workspace._id.toString(),
        name: workspace.name,
        type: workspace.type,
        status: workspace.status,
        ownerId,
        owner: userMap.get(ownerId) ?? {
          id: ownerId,
          email: 'unknown',
          displayName: 'Unknown User',
          avatarUrl: null,
        },
        createdById,
        createdBy: userMap.get(createdById) ?? {
          id: createdById,
          email: 'unknown',
          displayName: 'Unknown User',
          avatarUrl: null,
        },
        defaultForUserId: workspace.defaultForUserId?.toString() ?? null,
        members: activeMembers
          .map((member) => {
            const memberUserId = member.userId.toString();
            const user = userMap.get(memberUserId);
            if (!user) {
              return null;
            }

            return {
              userId: memberUserId,
              role: member.role,
              user,
            };
          })
          .filter((member): member is WorkspaceMemberWithDetails =>
            Boolean(member),
          ),
        createdAt: workspace.createdAt.toISOString(),
        updatedAt: workspace.updatedAt.toISOString(),
      };
    });
  }

  private async resolveActiveMembersByWorkspace(
    workspaces: any[],
  ): Promise<Map<string, WorkspaceMemberRecord[]>> {
    const workspaceObjectIds = workspaces.map((workspace) => workspace._id);
    const memberships = await this.membershipModel
      .find({ workspaceId: { $in: workspaceObjectIds } })
      .lean()
      .exec();

    const membersByWorkspace = new Map<string, WorkspaceMemberRecord[]>();
    const workspacesWithMemberships = new Set<string>();

    memberships.forEach((membership) => {
      const workspaceId = membership.workspaceId.toString();
      workspacesWithMemberships.add(workspaceId);

      if (membership.status !== WorkspaceMembershipStatus.ACTIVE) {
        return;
      }

      const members = membersByWorkspace.get(workspaceId) ?? [];
      members.push({
        userId: membership.userId,
        role: membership.role,
      });
      membersByWorkspace.set(workspaceId, members);
    });

    workspaces.forEach((workspace) => {
      const workspaceId = workspace._id.toString();
      if (workspacesWithMemberships.has(workspaceId)) {
        return;
      }

      membersByWorkspace.set(workspaceId, workspace.members ?? []);
    });

    return membersByWorkspace;
  }

  async update(
    id: string,
    dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceWithDetails> {
    const workspace = await this.workspaceModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .lean()
      .exec();
    if (!workspace) throw new NotFoundException('Workspace not found');

    const enriched = await this.enrichWorkspacesWithUserDetails([workspace]);
    return enriched[0]!;
  }

  async delete(id: string): Promise<void> {
    const result = await this.workspaceModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Workspace not found');
    await this.membershipModel.deleteMany({ workspaceId: result._id }).exec();
    await this.invitationModel.deleteMany({ workspaceId: result._id }).exec();
  }

  async inviteMember(
    workspaceId: string,
    invitedBy: string,
    dto: InviteMemberDto,
  ): Promise<WorkspaceInvitationResponse> {
    const workspaceObjectId = this.toObjectId(workspaceId, 'workspaceId');
    const userToInvite = await this.usersService.findByEmail(dto.email);

    if (userToInvite) {
      const existingMembership = await this.membershipModel
        .findOne({
          workspaceId: workspaceObjectId,
          userId: userToInvite._id,
          status: WorkspaceMembershipStatus.ACTIVE,
        })
        .exec();

      if (existingMembership) {
        throw new BadRequestException(
          'User is already a member of this workspace',
        );
      }
    }

    const existingPendingInvitation = await this.invitationModel
      .findOne({
        workspaceId: workspaceObjectId,
        email: dto.email.toLowerCase(),
        status: InvitationStatus.PENDING,
      })
      .exec();

    if (existingPendingInvitation) {
      if (existingPendingInvitation.expiresAt > new Date()) {
        throw new BadRequestException('A pending invitation already exists');
      }

      existingPendingInvitation.status = InvitationStatus.REJECTED;
      existingPendingInvitation.respondedAt = new Date();
      await existingPendingInvitation.save();
    }

    const invitation = new this.invitationModel({
      workspaceId: workspaceObjectId,
      email: dto.email,
      invitedBy: this.toObjectId(invitedBy, 'invitedBy'),
      role: dto.role,
      status: InvitationStatus.PENDING,
      token: randomBytes(24).toString('hex'),
      expiresAt: this.buildInvitationExpiry(),
    });

    const savedInvitation = await invitation.save();
    return this.serializeInvitation(savedInvitation);
  }

  async listWorkspaceInvitations(
    workspaceId: string,
  ): Promise<WorkspaceInvitationResponse[]> {
    const invitations = await this.invitationModel
      .find({
        workspaceId: this.toObjectId(workspaceId, 'workspaceId'),
        status: InvitationStatus.PENDING,
      })
      .sort({ createdAt: -1 })
      .exec();

    return invitations.map((invitation) =>
      this.serializeInvitation(invitation),
    );
  }

  async removeMember(workspaceId: string, userIdToRemove: string) {
    const workspace = await this.findOne(workspaceId);
    if (workspace.ownerId.toString() === userIdToRemove) {
      throw new BadRequestException('Cannot remove the owner of the workspace');
    }

    await this.membershipModel
      .findOneAndUpdate(
        {
          workspaceId: new Types.ObjectId(workspaceId),
          userId: new Types.ObjectId(userIdToRemove),
        },
        { $set: { status: WorkspaceMembershipStatus.LEFT } },
        { new: true },
      )
      .exec();

    await this.workspaceModel
      .findByIdAndUpdate(workspaceId, {
        $pull: { members: { userId: new Types.ObjectId(userIdToRemove) } },
      })
      .exec();
  }

  async listMembers(
    workspaceId: string,
  ): Promise<WorkspaceMemberWithDetails[]> {
    const workspace = await this.findOne(workspaceId);
    return workspace.members;
  }

  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    role: WorkspaceRole,
    currentUserId: string,
  ): Promise<WorkspaceMemberWithDetails> {
    const workspace = await this.workspaceModel.findById(workspaceId).exec();
    if (!workspace) throw new NotFoundException('Workspace not found');

    if (workspace.ownerId.toString() === memberId) {
      throw new BadRequestException(
        'Cannot change the role of the workspace owner',
      );
    }

    if (memberId === currentUserId) {
      throw new BadRequestException('Cannot change your own role');
    }

    const embeddedMember = workspace.members.find(
      (member) => member.userId.toString() === memberId,
    );
    if (!embeddedMember) {
      throw new NotFoundException('Member not found in workspace');
    }

    // Update embedded data
    embeddedMember.role = role;
    await workspace.save();

    // Update the separate membership document
    await this.membershipModel
      .findOneAndUpdate(
        {
          workspaceId: new Types.ObjectId(workspaceId),
          userId: new Types.ObjectId(memberId),
        },
        { $set: { role } },
      )
      .exec();

    const user = await this.usersService.findById(memberId);
    return {
      userId: memberId,
      role,
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
      },
    };
  }

  async getJoinLink(
    workspaceId: string,
  ): Promise<WorkspaceJoinLinkResponse | null> {
    const workspace = await this.workspaceModel
      .findById(workspaceId)
      .lean()
      .exec();
    if (!workspace || !workspace.joinLinkToken) return null;

    return {
      token: workspace.joinLinkToken,
      isEnabled: workspace.isJoinLinkEnabled ?? true,
      workspaceId: workspace._id.toString(),
      workspaceName: workspace.name,
    };
  }

  async generateJoinLink(
    workspaceId: string,
  ): Promise<WorkspaceJoinLinkResponse> {
    const token = randomBytes(16).toString('hex');
    const workspace = await this.workspaceModel
      .findByIdAndUpdate(
        workspaceId,
        {
          $set: {
            joinLinkToken: token,
            isJoinLinkEnabled: true,
          },
        },
        { new: true },
      )
      .lean()
      .exec();

    if (!workspace) throw new NotFoundException('Workspace not found');

    return {
      token,
      isEnabled: workspace.isJoinLinkEnabled ?? true,
      workspaceId: workspace._id.toString(),
      workspaceName: workspace.name,
    };
  }

  async deleteJoinLink(workspaceId: string): Promise<void> {
    const workspace = await this.workspaceModel
      .findByIdAndUpdate(
        workspaceId,
        {
          $unset: {
            joinLinkToken: 1,
            isJoinLinkEnabled: 1,
          },
        },
        { new: true },
      )
      .exec();

    if (!workspace) throw new NotFoundException('Workspace not found');
  }

  async toggleJoinLink(
    workspaceId: string,
    isEnabled: boolean,
  ): Promise<boolean> {
    const workspace = await this.workspaceModel
      .findByIdAndUpdate(
        workspaceId,
        { $set: { isJoinLinkEnabled: isEnabled } },
        { new: true },
      )
      .exec();

    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace.isJoinLinkEnabled;
  }

  async resolveWorkspaceByJoinLink(token: string) {
    const workspace = await this.workspaceModel
      .findOne({
        joinLinkToken: token,
        isJoinLinkEnabled: true,
        status: WorkspaceStatus.ACTIVE,
      })
      .lean()
      .exec();

    if (!workspace) throw new NotFoundException('Invalid or expired join link');

    return {
      id: workspace._id.toString(),
      name: workspace.name,
    };
  }

  async createJoinRequest(token: string, userId: string): Promise<void> {
    const workspace = await this.workspaceModel
      .findOne({
        joinLinkToken: token,
        isJoinLinkEnabled: true,
        status: WorkspaceStatus.ACTIVE,
      })
      .exec();

    if (!workspace) throw new NotFoundException('Invalid or expired join link');

    const existingMembership = await this.membershipModel
      .findOne({
        workspaceId: workspace._id,
        userId: new Types.ObjectId(userId),
        status: WorkspaceMembershipStatus.ACTIVE,
      })
      .exec();

    if (existingMembership) {
      throw new BadRequestException(
        'You are already a member of this workspace',
      );
    }

    try {
      await this.joinRequestModel.create({
        workspaceId: workspace._id,
        userId: new Types.ObjectId(userId),
        status: JoinRequestStatus.PENDING,
      });
    } catch (error: any) {
      if (this.isDuplicateKeyError(error)) {
        throw new BadRequestException(
          'You have already requested to join this workspace',
        );
      }
      throw error;
    }
  }

  async listJoinRequests(workspaceId: string) {
    const requests = await this.joinRequestModel
      .find({
        workspaceId: new Types.ObjectId(workspaceId),
        status: JoinRequestStatus.PENDING,
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (!requests.length) return [];

    const userIds = requests.map((r) => r.userId.toString());
    const users = await this.usersService.findByIds(userIds);

    const userMap = new Map();
    users.forEach((u) => {
      userMap.set(u._id.toString(), {
        id: u._id.toString(),
        email: u.email,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl ?? null,
      });
    });

    return requests.map((r) => ({
      id: r._id.toString(),
      workspaceId: r.workspaceId.toString(),
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      user: userMap.get(r.userId.toString()) ?? { id: r.userId.toString() },
    }));
  }

  async approveJoinRequest(
    workspaceId: string,
    requestId: string,
    resolvedBy: string,
  ): Promise<void> {
    const request = await this.joinRequestModel
      .findOne({
        _id: new Types.ObjectId(requestId),
        workspaceId: new Types.ObjectId(workspaceId),
        status: JoinRequestStatus.PENDING,
      })
      .exec();

    if (!request) {
      throw new NotFoundException('Join request not found or already resolved');
    }

    request.status = JoinRequestStatus.APPROVED;
    request.resolvedBy = new Types.ObjectId(resolvedBy);
    request.resolvedAt = new Date();
    await request.save();

    await this.upsertMembership(
      request.workspaceId,
      request.userId,
      WorkspaceRole.MEMBER,
      {
        status: WorkspaceMembershipStatus.ACTIVE,
        joinedAt: new Date(),
        lastActiveAt: new Date(),
      },
    );

    await this.ensureEmbeddedMember(
      request.workspaceId,
      request.userId,
      WorkspaceRole.MEMBER,
    );
  }

  async rejectJoinRequest(
    workspaceId: string,
    requestId: string,
    resolvedBy: string,
  ): Promise<void> {
    const request = await this.joinRequestModel
      .findOne({
        _id: new Types.ObjectId(requestId),
        workspaceId: new Types.ObjectId(workspaceId),
        status: JoinRequestStatus.PENDING,
      })
      .exec();

    if (!request) {
      throw new NotFoundException('Join request not found or already resolved');
    }

    request.status = JoinRequestStatus.REJECTED;
    request.resolvedBy = new Types.ObjectId(resolvedBy);
    request.resolvedAt = new Date();
    await request.save();
  }

  async ensureDefaultWorkspaceForUser(
    userId: string,
  ): Promise<WorkspaceDocument> {
    return this.workspaceProvisioningService.ensureDefaultWorkspaceForUser(
      userId,
    );
  }

  async resolveAccessContext(
    userId: string,
    requestedWorkspaceId?: string,
  ): Promise<WorkspaceRequestContext> {
    const user = await this.usersService.findById(userId);

    const fallbackWorkspaceId =
      requestedWorkspaceId ??
      user.activeWorkspaceId?.toString() ??
      user.defaultWorkspaceId?.toString();

    if (!fallbackWorkspaceId) {
      throw new ForbiddenException('Workspace setup is incomplete');
    }

    if (!Types.ObjectId.isValid(fallbackWorkspaceId)) {
      throw new ForbiddenException('Valid workspace id is required');
    }

    const workspace = await this.workspaceModel
      .findOne({
        _id: new Types.ObjectId(fallbackWorkspaceId),
        status: WorkspaceStatus.ACTIVE,
      })
      .exec();

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    let membership: WorkspaceMembershipDocument | null =
      await this.membershipModel
        .findOne({
          workspaceId: workspace._id,
          userId: new Types.ObjectId(userId),
        })
        .exec();

    if (!membership) {
      const embeddedMember = workspace.members.find(
        (member) => member.userId.toString() === userId,
      );

      if (embeddedMember) {
        membership = await this.upsertMembership(
          workspace._id,
          embeddedMember.userId,
          embeddedMember.role,
          {
            status: WorkspaceMembershipStatus.ACTIVE,
            joinedAt: workspace.createdAt ?? new Date(),
            lastActiveAt: new Date(),
          },
        );
      }
    }

    if (!membership && workspace.ownerId.toString() === userId) {
      membership = await this.upsertMembership(
        workspace._id,
        workspace.ownerId,
        WorkspaceRole.OWNER,
        {
          status: WorkspaceMembershipStatus.ACTIVE,
          joinedAt: workspace.createdAt ?? new Date(),
          lastActiveAt: new Date(),
        },
      );
    }

    if (!membership || membership.status !== WorkspaceMembershipStatus.ACTIVE) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    await this.membershipModel
      .findByIdAndUpdate(membership._id, { $set: { lastActiveAt: new Date() } })
      .exec();

    return {
      workspaceId: workspace._id.toString(),
      actorUserId: userId,
      role: membership.role,
      membershipStatus: membership.status,
      permissions: getWorkspacePermissions(membership.role),
      workspaceName: workspace.name,
      workspaceType: workspace.type,
      defaultWorkspaceId: user.defaultWorkspaceId?.toString() ?? null,
      activeWorkspaceId: user.activeWorkspaceId?.toString() ?? null,
    };
  }

  async acceptInvitation(
    invitationId: string,
    userId: string,
  ): Promise<WorkspaceInvitationResponse> {
    const invitation = await this.getPendingInvitation(invitationId);
    const user = await this.usersService.findById(userId);

    if (invitation.email !== user.email.toLowerCase()) {
      throw new ForbiddenException('Invitation does not belong to this user');
    }

    await this.upsertMembership(
      invitation.workspaceId,
      user._id,
      invitation.role,
      {
        status: WorkspaceMembershipStatus.ACTIVE,
        invitedBy: invitation.invitedBy,
        joinedAt: new Date(),
        lastActiveAt: new Date(),
      },
    );

    await this.ensureEmbeddedMember(
      invitation.workspaceId,
      user._id,
      invitation.role,
    );

    invitation.status = InvitationStatus.ACCEPTED;
    invitation.acceptedBy = user._id;
    invitation.respondedAt = new Date();
    await invitation.save();

    if (!user.activeWorkspaceId) {
      await this.usersService.updateWorkspacePreferences(user._id, {
        activeWorkspaceId: invitation.workspaceId,
      });
    }

    return this.serializeInvitation(invitation);
  }

  async rejectInvitation(
    invitationId: string,
    userId: string,
  ): Promise<WorkspaceInvitationResponse> {
    const invitation = await this.getPendingInvitation(invitationId);
    const user = await this.usersService.findById(userId);

    if (invitation.email !== user.email.toLowerCase()) {
      throw new ForbiddenException('Invitation does not belong to this user');
    }

    invitation.status = InvitationStatus.REJECTED;
    invitation.respondedAt = new Date();
    await invitation.save();

    return this.serializeInvitation(invitation);
  }

  async revokeInvitation(
    workspaceId: string,
    invitationId: string,
  ): Promise<WorkspaceInvitationResponse> {
    const invitation = await this.invitationModel
      .findOne({
        _id: this.toObjectId(invitationId, 'invitationId'),
        workspaceId: this.toObjectId(workspaceId, 'workspaceId'),
        status: InvitationStatus.PENDING,
      })
      .exec();

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    invitation.status = InvitationStatus.REVOKED;
    invitation.respondedAt = new Date();
    await invitation.save();

    return this.serializeInvitation(invitation);
  }

  async leaveWorkspace(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.findOne(workspaceId);
    if (workspace.ownerId.toString() === userId) {
      throw new BadRequestException(
        'Workspace owner cannot leave the workspace',
      );
    }

    await this.removeMember(workspaceId, userId);

    const user = await this.usersService.findById(userId);
    if (user.activeWorkspaceId?.toString() === workspaceId) {
      await this.usersService.updateWorkspacePreferences(user._id, {
        activeWorkspaceId: user.defaultWorkspaceId ?? null,
      });
    }
  }

  async switchActiveWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<void> {
    await this.resolveAccessContext(userId, workspaceId);
    await this.usersService.updateWorkspacePreferences(userId, {
      activeWorkspaceId: workspaceId,
    });
  }

  async listPendingInvitationsForUser(
    userId: string,
  ): Promise<WorkspaceInvitationResponse[]> {
    const user = await this.usersService.findById(userId);
    const invitations = await this.invitationModel
      .find({
        email: user.email.toLowerCase(),
        status: InvitationStatus.PENDING,
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 })
      .exec();

    return invitations.map((invitation) =>
      this.serializeInvitation(invitation),
    );
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

  private async ensureEmbeddedMember(
    workspaceId: Types.ObjectId,
    userId: Types.ObjectId,
    role: WorkspaceRole,
  ): Promise<void> {
    const workspace = await this.workspaceModel.findById(workspaceId).exec();
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const existingMember = workspace.members.find(
      (member) => member.userId.toString() === userId.toString(),
    );

    if (existingMember) {
      existingMember.role = role;
      await workspace.save();
      return;
    }

    workspace.members.push({ userId, role });
    await workspace.save();
  }

  private async getPendingInvitation(invitationId: string) {
    const invitation = await this.invitationModel
      .findOne({
        _id: this.toObjectId(invitationId, 'invitationId'),
        status: InvitationStatus.PENDING,
      })
      .exec();

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.expiresAt <= new Date()) {
      invitation.status = InvitationStatus.REJECTED;
      invitation.respondedAt = new Date();
      await invitation.save();
      throw new BadRequestException('Invitation has expired');
    }

    return invitation;
  }

  private buildInvitationExpiry(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return expiresAt;
  }

  private serializeInvitation(
    invitation: WorkspaceInvitationDocument,
  ): WorkspaceInvitationResponse {
    return {
      id: invitation._id.toString(),
      workspaceId: invitation.workspaceId.toString(),
      email: invitation.email,
      invitedBy: invitation.invitedBy.toString(),
      role: invitation.role,
      status: invitation.status,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      acceptedBy: invitation.acceptedBy?.toString() ?? null,
      respondedAt: invitation.respondedAt ?? null,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
    };
  }

  private toObjectId(value: string, fieldName: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }

    return new Types.ObjectId(value);
  }
}
