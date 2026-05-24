import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { NotificationType } from '../schemas/notification.schema';

/**
 * Event payload for task assignment
 */
export interface TaskAssignedEvent {
  taskId: string;
  taskName: string;
  assignerId: string;
  assignerName: string;
  assigneeId: string;
  workspaceId: string;
}

/**
 * Listener for task-related notification events.
 * Handles sending notifications when tasks are assigned to users.
 *
 * @example
 * ```typescript
 * // Emit event from TasksService
 * this.eventEmitter.emit('task.assigned', {
 *   taskId: task._id.toString(),
 *   taskName: task.name,
 *   assignerId: workspace.actorUserId,
 *   assignerName: currentUser.displayName,
 *   assigneeId: assignee.id.toString(),
 *   workspaceId: workspace.workspaceId,
 * });
 * ```
 */
@Injectable()
export class TaskNotificationsListener {
  private readonly logger = new Logger(TaskNotificationsListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Handle task.assigned event
   * Sends a notification to the assignee when a task is assigned to them
   */
  @OnEvent('task.assigned', { async: true })
  async handleTaskAssigned(payload: TaskAssignedEvent): Promise<void> {
    // Skip self-assignment notifications
    if (payload.assignerId === payload.assigneeId) {
      this.logger.debug(
        `Skipping self-assignment notification for task ${payload.taskId}`,
      );
      return;
    }

    try {
      await this.notificationsService.createForRecipient(
        payload.assigneeId,
        {
          type: NotificationType.TASK_ASSIGNED,
          title: 'New task assigned to you',
          body: `${payload.assignerName} assigned you to "${payload.taskName}"`,
          data: {
            taskId: payload.taskId,
            taskName: payload.taskName,
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
        `Task assignment notification sent: task=${payload.taskId}, assignee=${payload.assigneeId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send task assignment notification: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Don't throw - notification failures shouldn't break task operations
    }
  }
}
