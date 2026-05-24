import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GoalsService } from '../goals.service';

/**
 * Event listener for handling cross-module events related to goals.
 * Handles cleanup when linked tasks or habits are deleted.
 */
@Injectable()
export class GoalEventsListener {
  private readonly logger = new Logger(GoalEventsListener.name);

  constructor(private readonly goalsService: GoalsService) {}

  /**
   * Handle task.deleted event
   * Removes the deleted task from all linked goals
   */
  @OnEvent('task.deleted', { async: true })
  async handleTaskDeleted(payload: {
    taskId: string;
    userId: string;
  }): Promise<void> {
    try {
      this.logger.log(`Removing deleted task ${payload.taskId} from all goals`);
      await this.goalsService.handleTaskDeleted(payload.taskId);
    } catch (error) {
      this.logger.error(
        `Failed to remove task ${payload.taskId} from goals: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Handle habit.deleted event
   * Removes the deleted habit from all linked goals
   */
  @OnEvent('habit.deleted', { async: true })
  async handleHabitDeleted(payload: {
    habitId: string;
    userId: string;
  }): Promise<void> {
    try {
      this.logger.log(
        `Removing deleted habit ${payload.habitId} from all goals`,
      );
      await this.goalsService.handleHabitDeleted(payload.habitId);
    } catch (error) {
      this.logger.error(
        `Failed to remove habit ${payload.habitId} from goals: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Handle task.status_changed event
   * Could trigger progress recalculation for task-based goals
   */
  @OnEvent('task.status_changed', { async: true })
  async handleTaskStatusChanged(payload: {
    taskId: string;
    userId: string;
    oldStatus: string;
    newStatus: string;
  }): Promise<void> {
    // Progress is calculated on-the-fly, but we could add caching logic here
    this.logger.debug(
      `Task ${payload.taskId} status changed from ${payload.oldStatus} to ${payload.newStatus}`,
    );
  }

  /**
   * Handle habit.streak_updated event
   * Could trigger progress recalculation for habit-based goals
   */
  @OnEvent('habit.streak_updated', { async: true })
  async handleHabitStreakUpdated(payload: {
    habitId: string;
    userId: string;
    oldStreak: number;
    newStreak: number;
  }): Promise<void> {
    // Progress is calculated on-the-fly, but we could add caching logic here
    this.logger.debug(
      `Habit ${payload.habitId} streak updated from ${payload.oldStreak} to ${payload.newStreak}`,
    );
  }
}
