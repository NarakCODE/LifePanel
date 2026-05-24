import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { GoalsRepository } from './goals.repository';
import { GoalDocument, GoalType } from './schemas/goal.schema';
import { CreateGoalDto } from './dto/create-goal.dto';
import { GoalResponseDto } from './dto/goal-response.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { QueryGoalDto } from './dto/query-goal.dto';
import { LogProgressDto } from './dto/log-progress.dto';
import { LinkTasksDto } from './dto/link-tasks.dto';
import { LinkHabitsDto } from './dto/link-habits.dto';
import { TasksService } from '../tasks/tasks.service';
import { HabitsService } from '../habits/habits.service';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';

@Injectable()
export class GoalsService {
  constructor(
    private readonly goalsRepo: GoalsRepository,
    private readonly tasksService: TasksService,
    private readonly habitsService: HabitsService,
  ) {}

  async create(
    workspace: WorkspaceRequestContext,
    dto: CreateGoalDto,
  ): Promise<GoalResponseDto> {
    // Validate that linked tasks belong to the user
    if (dto.linkedTasks && dto.linkedTasks.length > 0) {
      await this.validateTasksOwnership(workspace, dto.linkedTasks);
    }

    // Validate that linked habits belong to the user
    if (dto.linkedHabits && dto.linkedHabits.length > 0) {
      await this.validateHabitsOwnership(workspace, dto.linkedHabits);
    }

    // Validate goal type consistency with linked items
    this.validateGoalTypeConsistency(
      dto.type,
      dto.linkedTasks,
      dto.linkedHabits,
    );

    const goal = await this.goalsRepo.create(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      dto,
    );
    return this.toGoalResponse(goal);
  }

  async findByIdAndUser(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<GoalResponseDto> {
    const goal = await this.goalsRepo.findByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    return this.toGoalResponse(goal);
  }

  async findMany(workspace: WorkspaceRequestContext, query: QueryGoalDto) {
    const { items, total } = await this.goalsRepo.findWithPaginationAndFilters(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      query,
    );

    return {
      items: items.map((goal) => this.toGoalResponse(goal)),
      total,
    };
  }

  async update(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateGoalDto,
  ): Promise<GoalResponseDto> {
    const scope = {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    };
    const existingGoal = await this.goalsRepo.findByIdAndUser(id, scope);
    if (!existingGoal) {
      throw new NotFoundException('Goal not found');
    }

    // Validate that linked tasks belong to the user
    if (dto.linkedTasks && dto.linkedTasks.length > 0) {
      await this.validateTasksOwnership(workspace, dto.linkedTasks);
    }

    // Validate that linked habits belong to the user
    if (dto.linkedHabits && dto.linkedHabits.length > 0) {
      await this.validateHabitsOwnership(workspace, dto.linkedHabits);
    }

    // Validate goal type consistency
    const type = dto.type ?? existingGoal.type;
    const linkedTasks =
      dto.linkedTasks ??
      existingGoal.linkedTasks.map((t: Types.ObjectId) => t.toString());
    const linkedHabits =
      dto.linkedHabits ??
      existingGoal.linkedHabits.map((h: Types.ObjectId) => h.toString());
    this.validateGoalTypeConsistency(type, linkedTasks, linkedHabits);

    const goal = await this.goalsRepo.updateByIdAndUser(id, scope, dto);
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    // Check if goal should be auto-completed
    await this.goalsRepo.checkAndCompleteGoal(id, scope);

    return this.toGoalResponse(goal);
  }

  async delete(id: string, workspace: WorkspaceRequestContext): Promise<void> {
    const deleted = await this.goalsRepo.deleteByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!deleted) {
      throw new NotFoundException('Goal not found');
    }
  }

  /**
   * Log progress for a manual goal
   */
  async logProgress(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: LogProgressDto,
  ): Promise<GoalResponseDto> {
    const scope = {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    };
    const goal = await this.goalsRepo.findByIdAndUser(id, scope);
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    // Only manual goals should allow progress logging
    // Task-based and habit-based goals calculate progress automatically
    if (goal.type !== GoalType.MANUAL && goal.type !== GoalType.MIXED) {
      throw new BadRequestException(
        `Cannot manually log progress for ${goal.type} goals. Progress is calculated automatically from linked items.`,
      );
    }

    const updatedGoal = await this.goalsRepo.logProgress(
      id,
      scope,
      dto.value,
      dto.note,
    );

    if (!updatedGoal) {
      throw new NotFoundException('Goal not found');
    }

    // Check if goal should be auto-completed
    await this.goalsRepo.checkAndCompleteGoal(id, scope);

    return this.toGoalResponse(updatedGoal);
  }

  /**
   * Link tasks to a goal
   */
  async linkTasks(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: LinkTasksDto,
  ): Promise<GoalResponseDto> {
    const scope = {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    };
    const goal = await this.goalsRepo.findByIdAndUser(id, scope);
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    // Validate task ownership
    await this.validateTasksOwnership(workspace, dto.taskIds);

    // Check if goal type supports task linking
    if (goal.type === GoalType.HABIT_BASED) {
      throw new BadRequestException(
        'Cannot link tasks to a habit-based goal. Change goal type first.',
      );
    }

    const taskObjectIds = dto.taskIds.map((tid) => new Types.ObjectId(tid));
    const updatedGoal = await this.goalsRepo.linkTasks(
      id,
      scope,
      taskObjectIds,
    );

    if (!updatedGoal) {
      throw new NotFoundException('Goal not found');
    }

    return this.toGoalResponse(updatedGoal);
  }

  /**
   * Link habits to a goal
   */
  async linkHabits(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: LinkHabitsDto,
  ): Promise<GoalResponseDto> {
    const scope = {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    };
    const goal = await this.goalsRepo.findByIdAndUser(id, scope);
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    // Validate habit ownership
    await this.validateHabitsOwnership(workspace, dto.habitIds);

    // Check if goal type supports habit linking
    if (goal.type === GoalType.TASK_BASED) {
      throw new BadRequestException(
        'Cannot link habits to a task-based goal. Change goal type first.',
      );
    }

    const habitObjectIds = dto.habitIds.map((hid) => new Types.ObjectId(hid));
    const updatedGoal = await this.goalsRepo.linkHabits(
      id,
      scope,
      habitObjectIds,
    );

    if (!updatedGoal) {
      throw new NotFoundException('Goal not found');
    }

    return this.toGoalResponse(updatedGoal);
  }

  /**
   * Unlink a task from a goal
   */
  async unlinkTask(
    id: string,
    workspace: WorkspaceRequestContext,
    taskId: string,
  ): Promise<GoalResponseDto> {
    const scope = {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    };
    const goal = await this.goalsRepo.findByIdAndUser(id, scope);
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    // Verify the task is actually linked
    const isLinked = await this.goalsRepo.hasTaskLinked(id, taskId);
    if (!isLinked) {
      throw new BadRequestException('Task is not linked to this goal');
    }

    const updatedGoal = await this.goalsRepo.unlinkTask(id, scope, taskId);

    if (!updatedGoal) {
      throw new NotFoundException('Goal not found');
    }

    return this.toGoalResponse(updatedGoal);
  }

  /**
   * Unlink a habit from a goal
   */
  async unlinkHabit(
    id: string,
    workspace: WorkspaceRequestContext,
    habitId: string,
  ): Promise<GoalResponseDto> {
    const scope = {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    };
    const goal = await this.goalsRepo.findByIdAndUser(id, scope);
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    // Verify the habit is actually linked
    const isLinked = await this.goalsRepo.hasHabitLinked(id, habitId);
    if (!isLinked) {
      throw new BadRequestException('Habit is not linked to this goal');
    }

    const updatedGoal = await this.goalsRepo.unlinkHabit(id, scope, habitId);

    if (!updatedGoal) {
      throw new NotFoundException('Goal not found');
    }

    return this.toGoalResponse(updatedGoal);
  }

  /**
   * Validate that all tasks belong to the user
   */
  private async validateTasksOwnership(
    workspace: WorkspaceRequestContext,
    taskIds: string[],
  ): Promise<void> {
    const uniqueTaskIds = [...new Set(taskIds)];

    for (const taskId of uniqueTaskIds) {
      try {
        await this.tasksService.findByIdAndUser(taskId, workspace);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new ForbiddenException(
            `Task ${taskId} not found or does not belong to you`,
          );
        }
        throw error;
      }
    }
  }

  /**
   * Validate that all habits belong to the user
   */
  private async validateHabitsOwnership(
    workspace: WorkspaceRequestContext,
    habitIds: string[],
  ): Promise<void> {
    const uniqueHabitIds = [...new Set(habitIds)];

    for (const habitId of uniqueHabitIds) {
      try {
        await this.habitsService.findByIdAndUser(habitId, workspace);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new ForbiddenException(
            `Habit ${habitId} not found or does not belong to you`,
          );
        }
        throw error;
      }
    }
  }

  /**
   * Validate goal type consistency with linked items
   */
  private validateGoalTypeConsistency(
    type: GoalType | undefined,
    linkedTasks: string[] | undefined,
    linkedHabits: string[] | undefined,
  ): void {
    const hasTasks = linkedTasks && linkedTasks.length > 0;
    const hasHabits = linkedHabits && linkedHabits.length > 0;

    if (type === GoalType.TASK_BASED && hasHabits && !hasTasks) {
      throw new BadRequestException(
        'Task-based goals cannot have linked habits. Use mixed type instead.',
      );
    }

    if (type === GoalType.HABIT_BASED && hasTasks && !hasHabits) {
      throw new BadRequestException(
        'Habit-based goals cannot have linked tasks. Use mixed type instead.',
      );
    }
  }

  /**
   * Handle task deletion - remove task from all goals
   * Called by event listener when a task is deleted
   */
  async handleTaskDeleted(taskId: string): Promise<void> {
    await this.goalsRepo.removeTaskFromAllGoals(taskId);
  }

  /**
   * Handle habit deletion - remove habit from all goals
   * Called by event listener when a habit is deleted
   */
  async handleHabitDeleted(habitId: string): Promise<void> {
    await this.goalsRepo.removeHabitFromAllGoals(habitId);
  }

  async getGoalOverview(workspace: WorkspaceRequestContext) {
    return this.goalsRepo.getGoalOverview({
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
  }

  private toGoalResponse(
    goal: GoalDocument | Record<string, any>,
  ): GoalResponseDto {
    const raw =
      typeof (goal as GoalDocument).toObject === 'function'
        ? ((goal as GoalDocument).toObject() as Record<string, any>)
        : goal;

    const targetValue = Number(raw.targetValue ?? 0);
    const currentValue = Number(raw.currentValue ?? 0);
    const progressPercent =
      typeof raw.progressPercent === 'number'
        ? raw.progressPercent
        : targetValue > 0
          ? Math.min(Math.round((currentValue / targetValue) * 100), 100)
          : 0;

    return new GoalResponseDto({
      id: this.toIdString(raw._id ?? raw.id) ?? '',
      workspaceId: this.toIdString(raw.workspaceId),
      userId: this.toIdString(raw.userId) ?? '',
      title: raw.title,
      description: raw.description,
      type: raw.type,
      targetValue,
      currentValue,
      unit: raw.unit,
      dueDate: raw.dueDate ?? null,
      status: raw.status,
      progressLogs: Array.isArray(raw.progressLogs)
        ? raw.progressLogs.map((entry: Record<string, any>) => ({
            value: Number(entry.value ?? 0),
            note: entry.note,
            loggedAt: entry.loggedAt,
          }))
        : [],
      linkedTasks: Array.isArray(raw.linkedTasks)
        ? raw.linkedTasks
            .map((value: Types.ObjectId | string) => this.toIdString(value))
            .filter((value): value is string => Boolean(value))
        : [],
      linkedHabits: Array.isArray(raw.linkedHabits)
        ? raw.linkedHabits
            .map((value: Types.ObjectId | string) => this.toIdString(value))
            .filter((value): value is string => Boolean(value))
        : [],
      progressPercent,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  private toIdString(
    value: Types.ObjectId | string | null | undefined,
  ): string | null {
    if (!value) return null;
    return typeof value === 'string' ? value : value.toString();
  }
}
