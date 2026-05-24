import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  buildWorkspaceScopedFilter,
  toObjectId,
  WorkspaceScope,
} from '../common/utils/workspace-scope.util';
import { Habit, HabitDocument } from './schemas/habit.schema';
import { CreateHabitDto } from './dto/create-habit.dto';

/**
 * Encapsulates all Mongoose queries for Habits (arch-use-repository-pattern).
 */
@Injectable()
export class HabitsRepository {
  constructor(
    @InjectModel(Habit.name) private readonly habitModel: Model<HabitDocument>,
  ) {}

  async create(
    scope: WorkspaceScope,
    dto: CreateHabitDto,
  ): Promise<HabitDocument> {
    const createdHabit = new this.habitModel({
      ...dto,
      workspaceId: toObjectId(scope.workspaceId),
      userId: toObjectId(scope.userId),
      createdBy: toObjectId(scope.userId),
      updatedBy: toObjectId(scope.userId),
    });
    return createdHabit.save();
  }

  async findByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<HabitDocument | null> {
    return this.habitModel
      .findOne({
        _id: new Types.ObjectId(id.toString()),
        ...buildWorkspaceScopedFilter(scope, {
          userId: toObjectId(scope.userId),
        }),
      })
      .exec();
  }

  async findWithPaginationAndFilters(
    scope: WorkspaceScope,
    query: any,
  ): Promise<{ items: HabitDocument[]; total: number }> {
    const filter: any = buildWorkspaceScopedFilter(scope, {
      userId: toObjectId(scope.userId),
    });

    if (query.status) filter.status = query.status;
    if (query.frequency) filter.frequency = query.frequency;

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    const sortObj: any = {};
    if (query.sortBy) {
      sortObj[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObj.createdAt = -1; // Default sort
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.habitModel.find(filter).sort(sortObj).skip(skip).limit(limit).exec(),
      this.habitModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async updateByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
    updateData: any,
  ): Promise<HabitDocument | null> {
    return this.habitModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id.toString()),
          ...buildWorkspaceScopedFilter(scope, {
            userId: toObjectId(scope.userId),
          }),
        },
        {
          $set: {
            ...updateData,
            updatedBy: toObjectId(scope.userId),
          },
        },
        { new: true },
      )
      .exec();
  }

  async archiveByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<HabitDocument | null> {
    return this.habitModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id.toString()),
          ...buildWorkspaceScopedFilter(scope, {
            userId: toObjectId(scope.userId),
          }),
        },
        {
          $set: {
            status: 'archived',
            archivedAt: new Date(),
            archivedBy: toObjectId(scope.userId),
            updatedBy: toObjectId(scope.userId),
          },
        },
        { new: true },
      )
      .exec();
  }

  async deleteByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<boolean> {
    const result = await this.habitModel
      .deleteOne({
        _id: new Types.ObjectId(id.toString()),
        ...buildWorkspaceScopedFilter(scope, {
          userId: toObjectId(scope.userId),
        }),
      })
      .exec();

    return result.deletedCount > 0;
  }

  async getHabitOverview(scope: WorkspaceScope): Promise<{
    total: number;
    activeCount: number;
    archivedCount: number;
    longestStreak: number;
    avgStreak: number;
  }> {
    const result = await this.habitModel
      .aggregate([
        {
          $match: buildWorkspaceScopedFilter(scope, {
            userId: toObjectId(scope.userId),
          }),
        },
        {
          $facet: {
            statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            streakStats: [
              {
                $group: {
                  _id: null,
                  longestStreak: { $max: '$longestStreak' },
                  avgStreak: { $avg: '$currentStreak' },
                },
              },
            ],
            total: [{ $count: 'count' }],
          },
        },
      ])
      .exec();

    const data = result[0] ?? {};
    const formatCount = (arr: Array<{ count: number }>) =>
      arr.length > 0 ? arr[0]!.count : 0;

    const overview = {
      total: formatCount(data.total ?? []),
      activeCount: 0,
      archivedCount: 0,
      longestStreak: 0,
      avgStreak: 0,
    };

    for (const statusCount of data.statusCounts ?? []) {
      if (statusCount._id === 'active') {
        overview.activeCount = statusCount.count;
      } else if (statusCount._id === 'archived') {
        overview.archivedCount = statusCount.count;
      }
    }

    if (data.streakStats?.length > 0) {
      overview.longestStreak = data.streakStats[0].longestStreak ?? 0;
      overview.avgStreak =
        data.streakStats[0].avgStreak != null
          ? Math.round(data.streakStats[0].avgStreak * 10) / 10
          : 0;
    }

    return overview;
  }
}
