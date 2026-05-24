import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { NotificationType } from '../schemas/notification.schema';

/**
 * Event payload for issue assignment
 */
export interface IssueAssignedEvent {
  issueId: string;
  issueIdentifier: string;
  issueTitle: string;
  assignerId: string;
  assignerName: string;
  assigneeId: string;
  workspaceId: string;
}

/**
 * Event payload for issue update
 */
export interface IssueUpdatedEvent {
  issueId: string;
  issueIdentifier: string;
  issueTitle: string;
  updaterId: string;
  updaterName: string;
  assigneeId: string;
  workspaceId: string;
  changes: string[];
}

/**
 * Listener for issue-related notification events.
 * Handles sending notifications when issues are assigned to users.
 */
@Injectable()
export class IssueNotificationsListener {
  private readonly logger = new Logger(IssueNotificationsListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Handle issue.assigned event
   * Sends a notification to the assignee when an issue is assigned to them
   */
  @OnEvent('issue.assigned', { async: true })
  async handleIssueAssigned(payload: IssueAssignedEvent): Promise<void> {
    // Skip self-assignment notifications
    if (payload.assignerId === payload.assigneeId) {
      this.logger.debug(
        `Skipping self-assignment notification for issue ${payload.issueId}`,
      );
      return;
    }

    try {
      await this.notificationsService.createForRecipient(
        payload.assigneeId,
        {
          type: NotificationType.ISSUE_ASSIGNED,
          title: 'New issue assigned to you',
          body: `${payload.assignerName} assigned you to "${payload.issueIdentifier}: ${payload.issueTitle}"`,
          data: {
            issueId: payload.issueId,
            issueIdentifier: payload.issueIdentifier,
            issueTitle: payload.issueTitle,
            assignerId: payload.assignerId,
            assignerName: payload.assignerName,
          },
        },
        {
          workspaceId: payload.workspaceId,
          createdByUserId: payload.assignerId,
        },
      );

      this.logger.log(
        `Issue assignment notification sent: issue=${payload.issueId}, assignee=${payload.assigneeId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send issue assignment notification: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Handle issue.updated event
   * Sends a notification to the assignee when an issue they are assigned to is updated
   */
  @OnEvent('issue.updated', { async: true })
  async handleIssueUpdated(payload: IssueUpdatedEvent): Promise<void> {
    // Skip if no assignee or self-update
    if (!payload.assigneeId || payload.updaterId === payload.assigneeId) {
      return;
    }

    try {
      const changesText = payload.changes.length > 0 
        ? ` (Changed: ${payload.changes.join(', ')})`
        : '';

      await this.notificationsService.createForRecipient(
        payload.assigneeId,
        {
          type: NotificationType.ISSUE_UPDATED,
          title: 'Issue updated',
          body: `${payload.updaterName} updated "${payload.issueIdentifier}: ${payload.issueTitle}"${changesText}`,
          data: {
            issueId: payload.issueId,
            issueIdentifier: payload.issueIdentifier,
            issueTitle: payload.issueTitle,
            updaterId: payload.updaterId,
            updaterName: payload.updaterName,
          },
        },
        {
          workspaceId: payload.workspaceId,
          createdByUserId: payload.updaterId,
        },
      );

      this.logger.log(
        `Issue update notification sent: issue=${payload.issueId}, assignee=${payload.assigneeId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send issue update notification: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
