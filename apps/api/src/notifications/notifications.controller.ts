import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { PaginatedResultDto } from '../common/dto/paginated-result.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { WorkspacePermissionGuard } from '../workspaces/guards/workspace-permission.guard';
import { WorkspaceContext } from '../workspaces/decorators/workspace-context.decorator';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { RequireWorkspacePermission } from '../workspaces/decorators/require-workspace-permission.decorator';
import { WorkspacePermission } from '../workspaces/workspace-permissions';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'x-workspace-id',
  required: false,
  description: 'Workspace context for workspace-scoped notification routes',
})
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard, WorkspacePermissionGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Create a new notification (system use or admin).
   * Note: In production, this might be restricted to internal services.
   */
  @Post()
  @RequireWorkspacePermission(WorkspacePermission.NOTIFICATION_WRITE)
  @ApiOperation({
    summary: 'Create a new notification for the authenticated user',
  })
  @ApiCreatedResponse({
    description: 'The created notification',
    type: NotificationResponseDto,
  })
  create(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() createNotificationDto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.create(workspace, createNotificationDto);
  }

  /**
   * List notifications for the authenticated user with pagination and filters.
   */
  @Get()
  @RequireWorkspacePermission(WorkspacePermission.NOTIFICATION_READ)
  @ApiOperation({
    summary: 'Get all notifications with pagination and filtering',
  })
  @ApiOkResponse({
    description: 'List of notifications and total count',
    type: PaginatedResultDto<NotificationResponseDto>,
  })
  findAll(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() queryNotificationDto: QueryNotificationDto,
  ): Promise<PaginatedResultDto<NotificationResponseDto>> {
    return this.notificationsService.findMany(workspace, queryNotificationDto);
  }

  /**
   * Get the count of unread notifications for the authenticated user.
   */
  @Get('unread-count')
  @RequireWorkspacePermission(WorkspacePermission.NOTIFICATION_READ)
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiOkResponse({
    description: 'The number of unread notifications',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 5 },
      },
    },
  })
  getUnreadCount(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ): Promise<{ count: number }> {
    return this.notificationsService.getUnreadCount(workspace);
  }

  /**
   * Get a specific notification by ID.
   */
  @Get(':id')
  @RequireWorkspacePermission(WorkspacePermission.NOTIFICATION_READ)
  @ApiOperation({ summary: 'Get a specific notification by ID' })
  @ApiOkResponse({
    description: 'The notification object',
    type: NotificationResponseDto,
  })
  findOne(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.findByIdAndUser(id, workspace);
  }

  /**
   * Mark a notification as read or unread.
   */
  @Patch(':id/read')
  @RequireWorkspacePermission(WorkspacePermission.NOTIFICATION_WRITE)
  @ApiOperation({ summary: 'Mark a notification as read or unread' })
  @ApiOkResponse({
    description: 'The updated notification',
    type: NotificationResponseDto,
  })
  markAsRead(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() markAsReadDto: MarkAsReadDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(
      id,
      workspace,
      markAsReadDto.isRead,
    );
  }

  /**
   * Mark all notifications as read for the authenticated user.
   */
  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @RequireWorkspacePermission(WorkspacePermission.NOTIFICATION_WRITE)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiOkResponse({
    description: 'Number of notifications marked as read',
    schema: {
      type: 'object',
      properties: {
        markedCount: { type: 'number', example: 12 },
      },
    },
  })
  markAllAsRead(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ): Promise<{ markedCount: number }> {
    return this.notificationsService.markAllAsRead(workspace);
  }

  /**
   * Delete a notification.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequireWorkspacePermission(WorkspacePermission.NOTIFICATION_WRITE)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiOkResponse({ description: 'Notification successfully deleted' })
  remove(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ): Promise<void> {
    return this.notificationsService.delete(id, workspace);
  }
}
