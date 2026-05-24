import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { NotificationDocument } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { PaginatedResultDto } from '../common/dto/paginated-result.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly notificationsRepo: NotificationsRepository) {}
  /**
   * Create a new notification for a user.
   * Used by the system or other modules to notify users.
   */
  async create(
    workspace: WorkspaceRequestContext,
    dto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationsRepo.create(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      dto,
    );
    this.logger.log(
      `Notification created for user ${workspace.actorUserId} in workspace ${workspace.workspaceId}: ${dto.type}`,
    );
    return this.mapToResponseDto(notification);
  }

  async createForRecipient(
    recipientUserId: string,
    dto: CreateNotificationDto,
    options?: {
      workspaceId?: string | null;
      createdByUserId?: string | null;
    },
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationsRepo.createForRecipient(
      recipientUserId,
      dto,
      options?.workspaceId ?? null,
      options?.createdByUserId ?? null,
    );
    this.logger.log(
      `Notification created for recipient ${recipientUserId} in workspace ${
        options?.workspaceId ?? 'global'
      }: ${dto.type}`,
    );

    return this.mapToResponseDto(notification);
  }

  /**
   * Find a notification by ID, scoped to the user.
   * Throws NotFoundException if not found or doesn't belong to user.
   */
  async findByIdAndUser(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationsRepo.findByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return this.mapToResponseDto(notification);
  }

  /**
   * List notifications for a user with pagination and filters.
   */
  async findMany(
    workspace: WorkspaceRequestContext,
    query: QueryNotificationDto,
  ): Promise<PaginatedResultDto<NotificationResponseDto>> {
    const { items, total } =
      await this.notificationsRepo.findWithPaginationAndFilters(
        { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
        query,
      );

    const data = items.map((item) => this.mapToResponseDto(item));
    return new PaginatedResultDto(data, total, query.page, query.limit);
  }

  /**
   * Get the count of unread notifications for a user.
   */
  async getUnreadCount(
    workspace: WorkspaceRequestContext,
  ): Promise<{ count: number }> {
    const count = await this.notificationsRepo.countUnread({
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    return { count };
  }

  /**
   * Mark a notification as read or unread.
   */
  async markAsRead(
    id: string,
    workspace: WorkspaceRequestContext,
    isRead: boolean = true,
  ): Promise<NotificationResponseDto> {
    // Verify the notification exists and belongs to the user
    const scope = {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    };
    const existing = await this.notificationsRepo.findByIdAndUser(id, scope);
    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    // Only update if the status is changing
    if (existing.isRead === isRead) {
      return this.mapToResponseDto(existing);
    }

    const updated = await this.notificationsRepo.markAsRead(id, scope, isRead);
    if (!updated) {
      throw new NotFoundException('Notification not found');
    }

    this.logger.log(
      `Notification ${id} marked as ${isRead ? 'read' : 'unread'} by user ${workspace.actorUserId}`,
    );
    return this.mapToResponseDto(updated);
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(
    workspace: WorkspaceRequestContext,
  ): Promise<{ markedCount: number }> {
    const markedCount = await this.notificationsRepo.markAllAsRead({
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    this.logger.log(
      `All notifications marked as read for user ${workspace.actorUserId} (${markedCount} items)`,
    );
    return { markedCount };
  }

  /**
   * Delete a notification (user-scoped).
   */
  async delete(id: string, workspace: WorkspaceRequestContext): Promise<void> {
    // Verify the notification exists and belongs to the user
    const scope = {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    };
    const existing = await this.notificationsRepo.findByIdAndUser(id, scope);
    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    const deleted = await this.notificationsRepo.deleteByIdAndUser(id, scope);
    if (!deleted) {
      throw new NotFoundException('Notification not found');
    }

    this.logger.log(
      `Notification ${id} deleted by user ${workspace.actorUserId}`,
    );
  }

  /**
   * Map a NotificationDocument to NotificationResponseDto.
   */
  private mapToResponseDto(
    notification: NotificationDocument,
  ): NotificationResponseDto {
    return new NotificationResponseDto({
      id: notification._id.toString(),
      workspaceId: notification.workspaceId?.toString() ?? null,
      userId: notification.userId.toString(),
      recipientUserId:
        notification.recipientUserId?.toString() ??
        notification.userId.toString(),
      createdBy: notification.createdBy?.toString() ?? null,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    });
  }
}
