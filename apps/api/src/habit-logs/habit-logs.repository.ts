import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  buildWorkspaceScopedFilter,
  toObjectId,
  WorkspaceScope,
} from '../common/utils/workspace-scope.util';
import { HabitLog, HabitLogDocument } from './schemas/habit-log.schema';
import { CreateHabitLogDto } from './dto/create-habit-log.dto';
import { QueryHabitLogDto } from './dto/query-habit-log.dto';
import { UpdateHabitLogDto } from './dto/update-habit-log.dto';

/**
 * Encapsulates all Mongoose queries for HabitLogs (arch-use-repository-pattern).
 */
@Injectable()
export class HabitLogsRepository {
  constructor(
    @InjectModel(HabitLog.name)
    private readonly habitLogModel: Model<HabitLogDocument>,
  ) {}

  async create(
    scope: WorkspaceScope,
    dto: CreateHabitLogDto,
  ): Promise<HabitLogDocument> {
    const createdHabitLog = new this.habitLogModel({
      ...dto,
      habitId: new Types.ObjectId(dto.habitId),
      workspaceId: toObjectId(scope.workspaceId),
      userId: toObjectId(scope.userId),
      actorUserId: toObjectId(scope.userId),
    });

    return createdHabitLog.save();
  }

  async findByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<HabitLogDocument | null> {
    return this.habitLogModel
      .findOne({
        _id: new Types.ObjectId(id.toString()),
        ...buildWorkspaceScopedFilter(scope, {
          userId: toObjectId(scope.userId),
        }),
      })
      .exec();
  }

  async findByHabitId(
    habitId: string | Types.ObjectId,
    scope: WorkspaceScope,
    query: QueryHabitLogDto,
  ): Promise<{ items: HabitLogDocument[]; total: number }> {
    const filter = this.buildFilter(scope, query, habitId);
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.habitLogModel
        .find(filter)
        .sort(this.buildSort(query))
        .skip(skip)
        .limit(limit)
        .exec(),
      this.habitLogModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async findByUserId(
    scope: WorkspaceScope,
    query: QueryHabitLogDto,
  ): Promise<{ items: HabitLogDocument[]; total: number }> {
    const filter = this.buildFilter(scope, query);
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.habitLogModel
        .find(filter)
        .sort(this.buildSort(query))
        .skip(skip)
        .limit(limit)
        .exec(),
      this.habitLogModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async findByDateRange(
    scope: WorkspaceScope,
    startDate: Date,
    endDate: Date,
  ): Promise<HabitLogDocument[]> {
    return this.habitLogModel
      .find({
        ...buildWorkspaceScopedFilter(scope, {
          userId: toObjectId(scope.userId),
        }),
        loggedDate: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ loggedDate: 1 })
      .exec();
  }

  async updateByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
    updateData: UpdateHabitLogDto,
  ): Promise<HabitLogDocument | null> {
    return this.habitLogModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id.toString()),
          ...buildWorkspaceScopedFilter(scope, {
            userId: toObjectId(scope.userId),
          }),
        },
        { $set: updateData },
        { new: true },
      )
      .exec();
  }

  async deleteByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<boolean> {
    const result = await this.habitLogModel
      .deleteOne({
        _id: new Types.ObjectId(id.toString()),
        ...buildWorkspaceScopedFilter(scope, {
          userId: toObjectId(scope.userId),
        }),
      })
      .exec();

    return result.deletedCount > 0;
  }

  async countByHabitAndDateRange(
    habitId: string | Types.ObjectId,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return this.habitLogModel
      .countDocuments({
        habitId: new Types.ObjectId(habitId.toString()),
        loggedDate: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .exec();
  }

  private buildFilter(
    scope: WorkspaceScope,
    query: QueryHabitLogDto,
    habitId?: string | Types.ObjectId,
  ) {
    const filter: Record<string, unknown> = buildWorkspaceScopedFilter(scope, {
      userId: toObjectId(scope.userId),
    });

    if (habitId) {
      filter.habitId = new Types.ObjectId(habitId.toString());
    } else if (query.habitId) {
      filter.habitId = new Types.ObjectId(query.habitId);
    }

    if (query.startDate || query.endDate) {
      filter.loggedDate = {};

      if (query.startDate) {
        (filter.loggedDate as Record<string, unknown>).$gte = query.startDate;
      }

      if (query.endDate) {
        (filter.loggedDate as Record<string, unknown>).$lte = query.endDate;
      }
    }

    if (query.search) {
      filter.notes = { $regex: query.search, $options: 'i' };
    }

    return filter;
  }

  private buildSort(query: QueryHabitLogDto): Record<string, 1 | -1> {
    if (query.sortBy) {
      const sort: Record<string, 1 | -1> = {};
      sort[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;
      return sort;
    }

    return { loggedDate: -1 };
  }
}
