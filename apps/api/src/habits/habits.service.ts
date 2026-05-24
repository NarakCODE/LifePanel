import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
import { HabitsRepository } from './habits.repository';
import { HabitDocument } from './schemas/habit.schema';
import { CreateHabitDto } from './dto/create-habit.dto';
import { HabitResponseDto } from './dto/habit-response.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { QueryHabitDto } from './dto/query-habit.dto';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';

@Injectable()
export class HabitsService {
  private readonly logger = new Logger(HabitsService.name);

  constructor(
    private readonly habitsRepo: HabitsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    workspace: WorkspaceRequestContext,
    dto: CreateHabitDto,
  ): Promise<HabitResponseDto> {
    if (!dto.startDate) {
      dto.startDate = new Date();
    }
    const habit = await this.habitsRepo.create(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      dto,
    );
    return this.toHabitResponse(habit);
  }

  async findByIdAndUser(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<HabitResponseDto> {
    const habit = await this.habitsRepo.findByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }
    return this.toHabitResponse(habit);
  }

  async findMany(workspace: WorkspaceRequestContext, query: QueryHabitDto) {
    const { items, total } = await this.habitsRepo.findWithPaginationAndFilters(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      query,
    );

    return {
      items: items.map((habit) => this.toHabitResponse(habit)),
      total,
    };
  }

  async update(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateHabitDto,
  ): Promise<HabitResponseDto> {
    const scope = {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    };
    const habit = await this.habitsRepo.findByIdAndUser(id, scope);
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    const oldStreak = habit.currentStreak;
    const updatedHabit = await this.habitsRepo.updateByIdAndUser(
      id,
      scope,
      dto,
    );

    if (!updatedHabit) {
      throw new NotFoundException('Habit not found');
    }

    // Emit streak update event if streak changed
    // Note: currentStreak is typically updated internally by habit-logs module
    if (updatedHabit.currentStreak !== oldStreak) {
      this.eventEmitter.emit('habit.streak_updated', {
        habitId: id,
        userId: workspace.actorUserId,
        oldStreak,
        newStreak: updatedHabit.currentStreak,
      });
    }

    return this.toHabitResponse(updatedHabit);
  }

  async archive(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<HabitResponseDto> {
    const habit = await this.habitsRepo.archiveByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }
    return this.toHabitResponse(habit);
  }

  async delete(id: string, workspace: WorkspaceRequestContext): Promise<void> {
    const scope = {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    };
    const habit = await this.habitsRepo.findByIdAndUser(id, scope);
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    const deleted = await this.habitsRepo.deleteByIdAndUser(id, scope);
    if (!deleted) {
      throw new NotFoundException('Habit not found');
    }

    // Emit deletion event for goals module to handle cleanup
    this.eventEmitter.emit('habit.deleted', {
      habitId: id,
      userId: workspace.actorUserId,
      workspaceId: workspace.workspaceId,
    });

    this.logger.log(
      `Habit ${id} deleted by user ${workspace.actorUserId} in workspace ${workspace.workspaceId}`,
    );
  }

  async getHabitOverview(workspace: WorkspaceRequestContext) {
    return this.habitsRepo.getHabitOverview({
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
  }

  private toHabitResponse(habit: HabitDocument): HabitResponseDto {
    const raw = habit.toObject() as HabitDocument & {
      _id: Types.ObjectId;
      workspaceId?: Types.ObjectId | null;
      userId: Types.ObjectId;
      createdBy: Types.ObjectId;
      updatedBy?: Types.ObjectId | null;
      archivedBy?: Types.ObjectId | null;
    };

    return new HabitResponseDto({
      id: raw._id.toString(),
      workspaceId: raw.workspaceId?.toString() ?? null,
      userId: raw.userId.toString(),
      createdBy: raw.createdBy?.toString() ?? '',
      updatedBy: raw.updatedBy?.toString() ?? null,
      archivedBy: raw.archivedBy?.toString() ?? null,
      name: raw.name,
      description: raw.description,
      frequency: raw.frequency,
      customDays: raw.customDays ?? [],
      targetCount: raw.targetCount,
      color: raw.color,
      status: raw.status,
      startDate: raw.startDate,
      endDate: raw.endDate ?? null,
      archivedAt: raw.archivedAt ?? null,
      currentStreak: raw.currentStreak,
      longestStreak: raw.longestStreak,
      isActive: raw.status === 'active',
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
