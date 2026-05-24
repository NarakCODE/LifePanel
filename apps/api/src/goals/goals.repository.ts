import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  buildWorkspaceScopedFilter,
  toObjectId,
  WorkspaceScope,
} from '../common/utils/workspace-scope.util';
import { Goal, GoalDocument, GoalStatus } from './schemas/goal.schema';
import { CreateGoalDto } from './dto/create-goal.dto';

/**
 * Encapsulates all Mongoose queries for Goals (arch-use-repository-pattern).
 */
@Injectable()
export class GoalsRepository {
  constructor(
    @InjectModel(Goal.name) private readonly goalModel: Model<GoalDocument>,
  ) {}

  async create(
    scope: WorkspaceScope,
    dto: CreateGoalDto,
  ): Promise<GoalDocument> {
    const createdGoal = new this.goalModel({
      ...dto,
      workspaceId: toObjectId(scope.workspaceId),
      userId: toObjectId(scope.userId),
      createdBy: toObjectId(scope.userId),
      updatedBy: toObjectId(scope.userId),
      linkedTasks: dto.linkedTasks?.map((id) => new Types.ObjectId(id)) || [],
      linkedHabits: dto.linkedHabits?.map((id) => new Types.ObjectId(id)) || [],
    });
    return createdGoal.save();
  }

  /**
   * Pipeline extension evaluating 'currentValue' dynamically for non-manual configurations
   */
  private progressCalculationStages() {
    return [
      {
        $lookup: {
          from: 'tasks',
          localField: 'linkedTasks',
          foreignField: '_id',
          as: 'resolvedTasks',
        },
      },
      {
        $lookup: {
          from: 'habits',
          localField: 'linkedHabits',
          foreignField: '_id',
          as: 'resolvedHabits',
        },
      },
      {
        $addFields: {
          currentValue: {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$type', 'task-based'] },
                  // Automatically count completed tasks
                  then: {
                    $size: {
                      $filter: {
                        input: '$resolvedTasks',
                        as: 't',
                        cond: { $eq: ['$$t.status', 'done'] },
                      },
                    },
                  },
                },
                {
                  case: { $eq: ['$type', 'habit-based'] },
                  // Sum the current streaks of active habits natively
                  then: {
                    $sum: '$resolvedHabits.currentStreak',
                  },
                },
                {
                  case: { $eq: ['$type', 'mixed'] },
                  // Mix configuration adding both stats together accurately
                  then: {
                    $add: [
                      {
                        $size: {
                          $filter: {
                            input: '$resolvedTasks',
                            as: 't',
                            cond: { $eq: ['$$t.status', 'done'] },
                          },
                        },
                      },
                      { $sum: '$resolvedHabits.currentStreak' },
                    ],
                  },
                },
              ],
              // Fallback to manual currentValue saved in schema
              default: '$currentValue',
            },
          },
        },
      },
      {
        $project: {
          resolvedTasks: 0,
          resolvedHabits: 0,
        },
      },
    ];
  }

  async findById(id: string | Types.ObjectId): Promise<GoalDocument | null> {
    return this.goalModel.findById(new Types.ObjectId(id.toString())).exec();
  }

  async findByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<any> {
    const results = await this.goalModel
      .aggregate([
        {
          $match: {
            _id: new Types.ObjectId(id.toString()),
            ...buildWorkspaceScopedFilter(scope, {
              userId: toObjectId(scope.userId),
            }),
          },
        },
        ...this.progressCalculationStages(),
      ])
      .exec();

    return results[0] || null;
  }

  async findWithPaginationAndFilters(
    scope: WorkspaceScope,
    query: any,
  ): Promise<{ items: any[]; total: number }> {
    const filter: any = buildWorkspaceScopedFilter(scope, {
      userId: toObjectId(scope.userId),
    });

    if (query.status) filter.status = query.status;
    if (query.type) filter.type = query.type;

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    const sortObj: any = {};
    if (query.sortBy) {
      sortObj[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObj.createdAt = -1;
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.goalModel
        .aggregate([
          { $match: filter },
          { $sort: sortObj },
          { $skip: skip },
          { $limit: limit },
          ...this.progressCalculationStages(),
        ])
        .exec(),
      this.goalModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async updateByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
    updateData: any,
  ): Promise<GoalDocument | null> {
    // Correctly mutate relationships dynamically
    if (updateData.linkedTasks) {
      updateData.linkedTasks = updateData.linkedTasks.map(
        (tid: string) => new Types.ObjectId(tid),
      );
    }
    if (updateData.linkedHabits) {
      updateData.linkedHabits = updateData.linkedHabits.map(
        (hid: string) => new Types.ObjectId(hid),
      );
    }

    return this.goalModel
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

  async deleteByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<boolean> {
    const result = await this.goalModel
      .deleteOne({
        _id: new Types.ObjectId(id.toString()),
        ...buildWorkspaceScopedFilter(scope, {
          userId: toObjectId(scope.userId),
        }),
      })
      .exec();

    return result.deletedCount > 0;
  }

  /**
   * Log progress for a manual goal
   */
  async logProgress(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
    value: number,
    note?: string,
  ): Promise<GoalDocument | null> {
    const progressLog = {
      value,
      note,
      loggedAt: new Date(),
    };

    return this.goalModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id.toString()),
          ...buildWorkspaceScopedFilter(scope, {
            userId: toObjectId(scope.userId),
          }),
        },
        {
          $push: { progressLogs: progressLog },
          $inc: { currentValue: value },
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Check if goal should be auto-completed and update status
   */
  async checkAndCompleteGoal(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<GoalDocument | null> {
    const goal = await this.goalModel
      .findOne({
        _id: new Types.ObjectId(id.toString()),
        ...buildWorkspaceScopedFilter(scope, {
          userId: toObjectId(scope.userId),
        }),
      })
      .exec();

    if (!goal) return null;

    if (
      goal.currentValue >= goal.targetValue &&
      goal.status !== GoalStatus.COMPLETED
    ) {
      goal.status = GoalStatus.COMPLETED;
      return goal.save();
    }

    return goal;
  }

  /**
   * Link tasks to a goal
   */
  async linkTasks(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
    taskIds: Types.ObjectId[],
  ): Promise<GoalDocument | null> {
    return this.goalModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id.toString()),
          ...buildWorkspaceScopedFilter(scope, {
            userId: toObjectId(scope.userId),
          }),
        },
        {
          $addToSet: { linkedTasks: { $each: taskIds } },
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Link habits to a goal
   */
  async linkHabits(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
    habitIds: Types.ObjectId[],
  ): Promise<GoalDocument | null> {
    return this.goalModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id.toString()),
          ...buildWorkspaceScopedFilter(scope, {
            userId: toObjectId(scope.userId),
          }),
        },
        {
          $addToSet: { linkedHabits: { $each: habitIds } },
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Unlink a task from a goal
   */
  async unlinkTask(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
    taskId: string | Types.ObjectId,
  ): Promise<GoalDocument | null> {
    return this.goalModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id.toString()),
          ...buildWorkspaceScopedFilter(scope, {
            userId: toObjectId(scope.userId),
          }),
        },
        {
          $pull: { linkedTasks: new Types.ObjectId(taskId.toString()) },
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Unlink a habit from a goal
   */
  async unlinkHabit(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
    habitId: string | Types.ObjectId,
  ): Promise<GoalDocument | null> {
    return this.goalModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id.toString()),
          ...buildWorkspaceScopedFilter(scope, {
            userId: toObjectId(scope.userId),
          }),
        },
        {
          $pull: { linkedHabits: new Types.ObjectId(habitId.toString()) },
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Remove a task from all goals (called when task is deleted)
   */
  async removeTaskFromAllGoals(taskId: string | Types.ObjectId): Promise<void> {
    await this.goalModel
      .updateMany(
        { linkedTasks: new Types.ObjectId(taskId.toString()) },
        { $pull: { linkedTasks: new Types.ObjectId(taskId.toString()) } },
      )
      .exec();
  }

  /**
   * Remove a habit from all goals (called when habit is deleted)
   */
  async removeHabitFromAllGoals(
    habitId: string | Types.ObjectId,
  ): Promise<void> {
    await this.goalModel
      .updateMany(
        { linkedHabits: new Types.ObjectId(habitId.toString()) },
        { $pull: { linkedHabits: new Types.ObjectId(habitId.toString()) } },
      )
      .exec();
  }

  /**
   * Check if goal has specific task linked
   */
  async hasTaskLinked(
    goalId: string | Types.ObjectId,
    taskId: string | Types.ObjectId,
  ): Promise<boolean> {
    const goal = await this.goalModel
      .findOne({
        _id: new Types.ObjectId(goalId.toString()),
        linkedTasks: new Types.ObjectId(taskId.toString()),
      })
      .exec();
    return !!goal;
  }

  /**
   * Check if goal has specific habit linked
   */
  async hasHabitLinked(
    goalId: string | Types.ObjectId,
    habitId: string | Types.ObjectId,
  ): Promise<boolean> {
    const goal = await this.goalModel
      .findOne({
        _id: new Types.ObjectId(goalId.toString()),
        linkedHabits: new Types.ObjectId(habitId.toString()),
      })
      .exec();
    return !!goal;
  }

  async getGoalOverview(scope: WorkspaceScope): Promise<{
    total: number;
    countsByStatus: {
      active: number;
      completed: number;
      archived: number;
    };
    avgProgressPercent: number;
  }> {
    const result = await this.goalModel
      .aggregate([
        {
          $match: buildWorkspaceScopedFilter(scope, {
            userId: toObjectId(scope.userId),
          }),
        },
        {
          $facet: {
            statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            avgProgress: [
              {
                $group: {
                  _id: null,
                  avgProgress: {
                    $avg: {
                      $cond: [
                        { $gt: ['$targetValue', 0] },
                        {
                          $multiply: [
                            { $divide: ['$currentValue', '$targetValue'] },
                            100,
                          ],
                        },
                        0,
                      ],
                    },
                  },
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
      countsByStatus: {
        active: 0,
        completed: 0,
        archived: 0,
      },
      avgProgressPercent: 0,
    };

    for (const statusCount of data.statusCounts ?? []) {
      const key = statusCount._id as string;
      if (key in overview.countsByStatus) {
        overview.countsByStatus[key as keyof typeof overview.countsByStatus] =
          statusCount.count;
      }
    }

    if (
      data.avgProgress?.length > 0 &&
      data.avgProgress[0].avgProgress != null
    ) {
      overview.avgProgressPercent = Math.round(data.avgProgress[0].avgProgress);
    }

    return overview;
  }
}
