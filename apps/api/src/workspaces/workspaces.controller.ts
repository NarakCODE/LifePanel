import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceAccessGuard } from './guards/workspace-access.guard';
import { WorkspacePermissionGuard } from './guards/workspace-permission.guard';
import { WorkspaceRoleGuard } from './guards/workspace-role.guard';
import { RequireWorkspacePermission } from './decorators/require-workspace-permission.decorator';
import { RequireWorkspaceRole } from './decorators/require-workspace-role.decorator';
import { WorkspaceRole } from './schemas/workspace.schema';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WorkspacePermission } from './workspace-permissions';

@ApiTags('workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateWorkspaceDto,
  ) {
    const data = await this.workspacesService.create(userId, dto);
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List workspaces for current user' })
  async findAll(@CurrentUser('sub') userId: string) {
    const data = await this.workspacesService.findAllForUser(userId);
    return { success: true, data };
  }

  @Get('invitations/mine')
  @ApiOperation({ summary: 'List pending invitations for the current user' })
  async listMyInvitations(@CurrentUser('sub') userId: string) {
    const data =
      await this.workspacesService.listPendingInvitationsForUser(userId);
    return { success: true, data };
  }

  @Get('resolve-context')
  @ApiOperation({
    summary:
      'Resolve the authenticated user workspace context for the requested workspace',
  })
  async resolveContext(
    @CurrentUser('sub') userId: string,
    @Query('workspaceId') workspaceId?: string,
  ) {
    const data = await this.workspacesService.resolveAccessContext(
      userId,
      workspaceId,
    );
    return { success: true, data };
  }

  @Post(':workspaceId/invitations')
  @UseGuards(WorkspaceAccessGuard, WorkspacePermissionGuard)
  @RequireWorkspacePermission(WorkspacePermission.MEMBER_INVITE)
  @ApiOperation({ summary: 'Invite a user to the workspace' })
  async invite(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: InviteMemberDto,
  ) {
    const data = await this.workspacesService.inviteMember(
      workspaceId,
      userId,
      dto,
    );
    return { success: true, data };
  }

  @Get(':workspaceId/invitations')
  @UseGuards(WorkspaceAccessGuard, WorkspacePermissionGuard)
  @RequireWorkspacePermission(WorkspacePermission.MEMBER_INVITE)
  @ApiOperation({ summary: 'List pending invitations for a workspace' })
  async listWorkspaceInvitations(@Param('workspaceId') workspaceId: string) {
    const data =
      await this.workspacesService.listWorkspaceInvitations(workspaceId);
    return { success: true, data };
  }

  @Get(':workspaceId')
  @UseGuards(WorkspaceAccessGuard)
  @ApiOperation({ summary: 'Get workspace details' })
  async findOne(@Param('workspaceId') workspaceId: string) {
    const data = await this.workspacesService.findOne(workspaceId);
    return { success: true, data };
  }

  @Patch(':workspaceId')
  @UseGuards(WorkspaceAccessGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Update workspace details' })
  async update(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    const data = await this.workspacesService.update(workspaceId, dto);
    return { success: true, data };
  }

  @Delete(':workspaceId/')
  @UseGuards(WorkspaceAccessGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(WorkspaceRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a workspace' })
  async remove(@Param('workspaceId') workspaceId: string) {
    await this.workspacesService.delete(workspaceId);
  }

  @Get(':workspaceId/members')
  @UseGuards(WorkspaceAccessGuard)
  @ApiOperation({ summary: 'List all members in the workspace' })
  async listMembers(@Param('workspaceId') workspaceId: string) {
    const data = await this.workspacesService.listMembers(workspaceId);
    return { success: true, data };
  }

  @Patch(':workspaceId/members/:memberId')
  @UseGuards(WorkspaceAccessGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Update a member role' })
  async updateMemberRole(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser('sub') currentUserId: string,
  ) {
    const data = await this.workspacesService.updateMemberRole(
      workspaceId,
      memberId,
      dto.role,
      currentUserId,
    );
    return { success: true, data };
  }

  @Delete(':workspaceId/members/:memberId')
  @UseGuards(WorkspaceAccessGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the workspace' })
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.workspacesService.removeMember(workspaceId, memberId);
  }

  @Post('invitations/:invitationId/accept')
  @ApiOperation({ summary: 'Accept a pending workspace invitation' })
  async acceptInvitation(
    @Param('invitationId') invitationId: string,
    @CurrentUser('sub') userId: string,
  ) {
    const data = await this.workspacesService.acceptInvitation(
      invitationId,
      userId,
    );
    return { success: true, data };
  }

  @Post('invitations/:invitationId/reject')
  @ApiOperation({ summary: 'Reject a pending workspace invitation' })
  async rejectInvitation(
    @Param('invitationId') invitationId: string,
    @CurrentUser('sub') userId: string,
  ) {
    const data = await this.workspacesService.rejectInvitation(
      invitationId,
      userId,
    );
    return { success: true, data };
  }

  @Delete(':workspaceId/invitations/:invitationId')
  @UseGuards(WorkspaceAccessGuard, WorkspacePermissionGuard)
  @RequireWorkspacePermission(WorkspacePermission.MEMBER_INVITE)
  @ApiOperation({ summary: 'Revoke a pending workspace invitation' })
  async revokeInvitation(
    @Param('workspaceId') workspaceId: string,
    @Param('invitationId') invitationId: string,
  ) {
    const data = await this.workspacesService.revokeInvitation(
      workspaceId,
      invitationId,
    );
    return { success: true, data };
  }

  // Join Requests / Public Join Link Endpoints

  @Get(':workspaceId/join-link')
  @UseGuards(WorkspaceAccessGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({
    summary: 'Get existing join link (returns 404 if not exists)',
  })
  async getJoinLink(@Param('workspaceId') workspaceId: string) {
    const data = await this.workspacesService.getJoinLink(workspaceId);
    if (!data) throw new NotFoundException('No join link exists');
    return { success: true, data };
  }

  @Post(':workspaceId/join-link')
  @UseGuards(WorkspaceAccessGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Generate or regenerate a new public join link' })
  async generateJoinLink(@Param('workspaceId') workspaceId: string) {
    const data = await this.workspacesService.generateJoinLink(workspaceId);
    return { success: true, data };
  }

  @Delete(':workspaceId/join-link')
  @UseGuards(WorkspaceAccessGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete the public join link' })
  async deleteJoinLink(@Param('workspaceId') workspaceId: string) {
    await this.workspacesService.deleteJoinLink(workspaceId);
  }

  @Patch(':workspaceId/join-link')
  @UseGuards(WorkspaceAccessGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Enable or disable the public join link' })
  async toggleJoinLink(
    @Param('workspaceId') workspaceId: string,
    @Body('isEnabled') isEnabled: boolean,
  ) {
    const data = await this.workspacesService.toggleJoinLink(
      workspaceId,
      isEnabled,
    );
    return { success: true, data };
  }

  @Get('join/:token')
  @ApiOperation({ summary: 'Get workspace info by join link token' })
  async resolveJoinLink(@Param('token') token: string) {
    const data = await this.workspacesService.resolveWorkspaceByJoinLink(token);
    return { success: true, data };
  }

  @Post('join/:token/request')
  @ApiOperation({
    summary: 'Request to join a workspace via its join link token',
  })
  async createJoinRequest(
    @Param('token') token: string,
    @CurrentUser('sub') userId: string,
  ) {
    await this.workspacesService.createJoinRequest(token, userId);
    return { success: true };
  }

  @Get(':workspaceId/join-requests')
  @UseGuards(WorkspaceAccessGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'List pending join requests for a workspace' })
  async listJoinRequests(@Param('workspaceId') workspaceId: string) {
    const data = await this.workspacesService.listJoinRequests(workspaceId);
    return { success: true, data };
  }

  @Post(':workspaceId/join-requests/:requestId/approve')
  @UseGuards(WorkspaceAccessGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Approve a pending join request' })
  async approveJoinRequest(
    @Param('workspaceId') workspaceId: string,
    @Param('requestId') requestId: string,
    @CurrentUser('sub') userId: string,
  ) {
    await this.workspacesService.approveJoinRequest(
      workspaceId,
      requestId,
      userId,
    );
    return { success: true };
  }

  @Post(':workspaceId/join-requests/:requestId/reject')
  @UseGuards(WorkspaceAccessGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Reject a pending join request' })
  async rejectJoinRequest(
    @Param('workspaceId') workspaceId: string,
    @Param('requestId') requestId: string,
    @CurrentUser('sub') userId: string,
  ) {
    await this.workspacesService.rejectJoinRequest(
      workspaceId,
      requestId,
      userId,
    );
    return { success: true };
  }

  @Post(':workspaceId/switch')
  @UseGuards(WorkspaceAccessGuard)
  @ApiOperation({ summary: 'Switch the authenticated user active workspace' })
  async switchWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('sub') userId: string,
  ) {
    await this.workspacesService.switchActiveWorkspace(userId, workspaceId);
    return { success: true, data: { workspaceId } };
  }

  @Post(':workspaceId/leave')
  @UseGuards(WorkspaceAccessGuard)
  @ApiOperation({ summary: 'Leave a workspace as the current member' })
  async leaveWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('sub') userId: string,
  ) {
    await this.workspacesService.leaveWorkspace(workspaceId, userId);
    return { success: true, data: { workspaceId } };
  }
}
