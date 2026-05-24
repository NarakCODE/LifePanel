import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types, UpdateQuery } from 'mongoose';
import {
  buildWorkspaceScopedFilter,
  toObjectId,
  toObjectIdOrNull,
  WorkspaceScope,
} from '../common/utils/workspace-scope.util';
import { QueryTaskDto } from './dto/query-task.dto';
import {
  Task,
  TaskActivityEntry,
  TaskAssigneeSnapshot,
  TaskChecklist,
  TaskComment,
  TaskCustomField,
  TaskDependency,
  TaskDocument,
  TaskPriority,
  TaskStatus,
  TaskType,
} from './schemas/task.schema';

export type TaskPersistenceInput = {
  name: string;
  projectId: string;
  projectName: string;
  workstreamId?: string;
  workstreamName?: string;
  assignee?: TaskAssigneeSnapshot | null;
  assignees?: TaskAssigneeSnapshot[];
  watchers?: TaskAssigneeSnapshot[];
  description?: string;
  markdownDescription?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  tag?: string;
  tags?: string[];
  startDate?: Date;
  dueDate?: Date;
  dueDateTime?: Date;
  timeEstimateMinutes?: number;
  timeSpentMinutes?: number;
  parentTaskId?: Types.ObjectId | null;
  subtaskIds?: Types.ObjectId[];
  checklists?: TaskChecklist[];
  comments?: TaskComment[];
  customFields?: TaskCustomField[];
  dependencies?: TaskDependency[];
  activity?: TaskActivityEntry[];
  duplicatedFromTaskId?: Types.ObjectId | null;
  completedAt?: Date | null;
};

export type TaskFilterCounts = {
  status: Record<string, number>;
  priority: Record<string, number>;
  tags: Record<string, number>;
  members: Record<string, number>;
};

export type TaskListResult = {
  items: TaskDocument[];
  total: number;
  filterCounts: TaskFilterCounts;
};

export type TaskOrderValues = {
  projectOrder: number;
  workstreamOrder: number;
};

type TaskQueryFilter = Record<string, any>;

/**
 * Encapsulates all Mongoose queries for Tasks (arch-use-repository-pattern).
 */
@Injectable()
export class TasksRepository {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
  ) {}

  async create(
    scope: WorkspaceScope,
    input: TaskPersistenceInput,
  ): Promise<TaskDocument> {
    const orders = await this.getNextProjectOrders(
      scope.workspaceId,
      input.projectId,
      input.workstreamId,
    );

    const createdTask = new this.taskModel({
      ...input,
      workspaceId: toObjectId(scope.workspaceId),
      userId: toObjectId(scope.userId),
      createdBy: toObjectId(scope.userId),
      updatedBy: toObjectId(scope.userId),
      completedBy: input.completedAt ? toObjectId(scope.userId) : null,
      ...this.getAssigneeCompatFields(input),
      ...this.getTagCompatFields(input),
      projectOrder: orders.projectOrder,
      workstreamOrder: orders.workstreamOrder,
    });

    return createdTask.save();
  }

  async findByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<TaskDocument | null> {
    const taskId = toObjectIdOrNull(id);
    if (!taskId) {
      return null;
    }

    return this.taskModel
      .findOne({
        _id: taskId,
        ...buildWorkspaceScopedFilter(scope, {
          userId: toObjectId(scope.userId),
        }),
      })
      .exec();
  }

  async findWithPaginationAndFilters(
    scope: WorkspaceScope,
    query: QueryTaskDto,
  ): Promise<TaskListResult> {
    const scopedFilter = this.buildScopedFilter(scope, query);
    const taskFilter = this.applyTaskFilters(scopedFilter, query);
    const sort = this.buildSort(query);
    const limit = query.limit ?? 20;
    const skip = query.skip;

    const [items, total, filterCounts] = await Promise.all([
      this.taskModel.find(taskFilter).sort(sort).skip(skip).limit(limit).exec(),
      this.taskModel.countDocuments(taskFilter).exec(),
      this.getFilterCounts(scopedFilter),
    ]);

    return {
      items,
      total,
      filterCounts,
    };
  }

  async updateByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
    updateData: UpdateQuery<TaskDocument>,
  ): Promise<TaskDocument | null> {
    const taskId = toObjectIdOrNull(id);
    if (!taskId) {
      return null;
    }

    const nextSet = { ...(updateData.$set ?? {}) } as Record<string, unknown>;
    nextSet.updatedBy = toObjectId(scope.userId);

    if ('assignee' in nextSet) {
      const assignee = nextSet.assignee as TaskAssigneeSnapshot | null;
      nextSet.assigneeId = assignee?.id ? toObjectId(assignee.id) : null;
    }

    if ('assignees' in nextSet) {
      const assignees = nextSet.assignees as TaskAssigneeSnapshot[];
      nextSet.assignee = assignees[0] ?? null;
      nextSet.assigneeId = assignees[0]?.id
        ? toObjectId(assignees[0].id)
        : null;
      nextSet.assigneeIds = assignees.map((assignee) =>
        toObjectId(assignee.id),
      );
    }

    if ('tags' in nextSet) {
      const tags = nextSet.tags as string[];
      nextSet.tag = tags[0] ?? undefined;
    } else if ('tag' in nextSet) {
      const tag = nextSet.tag as string | undefined;
      nextSet.tags = tag ? [tag] : [];
    }

    return this.taskModel
      .findOneAndUpdate(
        {
          _id: taskId,
          ...buildWorkspaceScopedFilter(scope, {
            userId: toObjectId(scope.userId),
          }),
        },
        {
          ...updateData,
          $set: nextSet,
        },
        { new: true },
      )
      .exec();
  }

  async deleteByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<boolean> {
    const taskId = toObjectIdOrNull(id);
    if (!taskId) {
      return false;
    }

    const result = await this.taskModel
      .deleteOne({
        _id: taskId,
        ...buildWorkspaceScopedFilter(scope, {
          userId: toObjectId(scope.userId),
        }),
      })
      .exec();

    return result.deletedCount > 0;
  }

  async findByIdInProject(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
    projectId: string,
  ): Promise<TaskDocument | null> {
    const taskId = toObjectIdOrNull(id);
    if (!taskId) {
      return null;
    }

    return this.taskModel
      .findOne({
        _id: taskId,
        projectId,
        ...buildWorkspaceScopedFilter(scope, {}),
      })
      .exec();
  }

  async findByProject(
    scope: WorkspaceScope,
    projectId: string,
  ): Promise<TaskDocument[]> {
    return this.taskModel
      .find({
        projectId,
        ...buildWorkspaceScopedFilter(scope, {}),
      })
      .sort({
        projectOrder: 1,
        workstreamOrder: 1,
        createdAt: 1,
      })
      .exec();
  }

  async updateByIdInProject(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
    projectId: string,
    updateData: UpdateQuery<TaskDocument>,
  ): Promise<TaskDocument | null> {
    const taskId = toObjectIdOrNull(id);
    if (!taskId) {
      return null;
    }

    const nextSet = { ...(updateData.$set ?? {}) } as Record<string, unknown>;
    nextSet.updatedBy = toObjectId(scope.userId);

    if ('assignee' in nextSet) {
      const assignee = nextSet.assignee as TaskAssigneeSnapshot | null;
      nextSet.assigneeId = assignee?.id ? toObjectId(assignee.id) : null;
    }

    if ('assignees' in nextSet) {
      const assignees = nextSet.assignees as TaskAssigneeSnapshot[];
      nextSet.assignee = assignees[0] ?? null;
      nextSet.assigneeId = assignees[0]?.id
        ? toObjectId(assignees[0].id)
        : null;
      nextSet.assigneeIds = assignees.map((assignee) =>
        toObjectId(assignee.id),
      );
    }

    if ('tags' in nextSet) {
      const tags = nextSet.tags as string[];
      nextSet.tag = tags[0] ?? undefined;
    } else if ('tag' in nextSet) {
      const tag = nextSet.tag as string | undefined;
      nextSet.tags = tag ? [tag] : [];
    }

    return this.taskModel
      .findOneAndUpdate(
        {
          _id: taskId,
          projectId,
          ...buildWorkspaceScopedFilter(scope, {}),
        },
        {
          ...updateData,
          $set: nextSet,
        },
        { new: true },
      )
      .exec();
  }

  async reorderProjectTasks(
    scope: WorkspaceScope,
    projectId: string,
    orderedTaskIds: string[],
  ): Promise<void> {
    const taskObjectIds = orderedTaskIds
      .map((taskId) => toObjectIdOrNull(taskId))
      .filter((taskId): taskId is Types.ObjectId => taskId !== null);

    if (!taskObjectIds.length) {
      return;
    }

    await this.taskModel.bulkWrite(
      taskObjectIds.map((taskId, index) => ({
        updateOne: {
          filter: {
            _id: taskId,
            projectId,
            ...buildWorkspaceScopedFilter(scope, {}),
          },
          update: {
            $set: {
              projectOrder: index,
              updatedBy: toObjectId(scope.userId),
            },
          },
        },
      })),
    );
  }

  async reorderWorkstreamTasks(
    scope: WorkspaceScope,
    projectId: string,
    workstreamId: string,
    orderedTaskIds: string[],
  ): Promise<void> {
    const taskObjectIds = orderedTaskIds
      .map((taskId) => toObjectIdOrNull(taskId))
      .filter((taskId): taskId is Types.ObjectId => taskId !== null);

    if (!taskObjectIds.length) {
      return;
    }

    await this.taskModel.bulkWrite(
      taskObjectIds.map((taskId, index) => ({
        updateOne: {
          filter: {
            _id: taskId,
            projectId,
            workstreamId,
            ...buildWorkspaceScopedFilter(scope, {}),
          },
          update: {
            $set: {
              workstreamOrder: index,
              updatedBy: toObjectId(scope.userId),
            },
          },
        },
      })),
    );
  }

  async getTaskOverview(scope: WorkspaceScope): Promise<{
    totalTasks: number;
    countsByStatus: {
      todo: number;
      in_progress: number;
      done: number;
      archived: number;
    };
    overdueCount: number;
    upcomingCount: number;
    completedSummary: {
      total: number;
      latest: Date | null;
    };
  }> {
    const now = new Date();

    const result = await this.taskModel
      .aggregate([
        {
          $match: buildWorkspaceScopedFilter(scope, {
            userId: toObjectId(scope.userId),
          }),
        },
        {
          $addFields: {
            schedulingDate: {
              $ifNull: ['$dueDate', '$startDate'],
            },
          },
        },
        {
          $facet: {
            statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            overdue: [
              {
                $match: {
                  status: { $nin: [TaskStatus.DONE, TaskStatus.ARCHIVED] },
                  schedulingDate: { $lt: now },
                },
              },
              { $count: 'count' },
            ],
            upcoming: [
              {
                $match: {
                  status: { $nin: [TaskStatus.DONE, TaskStatus.ARCHIVED] },
                  schedulingDate: { $gte: now },
                },
              },
              { $count: 'count' },
            ],
            completedSummary: [
              { $match: { status: TaskStatus.DONE } },
              {
                $group: {
                  _id: null,
                  totalCompleted: { $sum: 1 },
                  latestCompletion: { $max: '$completedAt' },
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
      totalTasks: formatCount(data.total ?? []),
      countsByStatus: {
        todo: 0,
        in_progress: 0,
        done: 0,
        archived: 0,
      },
      overdueCount: formatCount(data.overdue ?? []),
      upcomingCount: formatCount(data.upcoming ?? []),
      completedSummary:
        data.completedSummary?.length > 0
          ? {
              total: data.completedSummary[0].totalCompleted,
              latest: data.completedSummary[0].latestCompletion ?? null,
            }
          : { total: 0, latest: null },
    };

    for (const statusCount of data.statusCounts ?? []) {
      switch (statusCount._id) {
        case TaskStatus.TODO:
          overview.countsByStatus.todo = statusCount.count;
          break;
        case TaskStatus.IN_PROGRESS:
        case 'in_progress':
          overview.countsByStatus.in_progress = statusCount.count;
          break;
        case TaskStatus.DONE:
          overview.countsByStatus.done = statusCount.count;
          break;
        case TaskStatus.ARCHIVED:
          overview.countsByStatus.archived = statusCount.count;
          break;
        default:
          break;
      }
    }

    return overview;
  }

  private buildScopedFilter(
    scope: WorkspaceScope,
    query: QueryTaskDto,
  ): TaskQueryFilter {
    const filter: TaskQueryFilter = buildWorkspaceScopedFilter(scope, {
      userId: toObjectId(scope.userId),
    });

    if (query.projectId) {
      filter.projectId = query.projectId;
    }

    if (query.startDateFrom || query.startDateTo) {
      filter.startDate = {};

      if (query.startDateFrom) {
        filter.startDate.$gte = query.startDateFrom;
      }

      if (query.startDateTo) {
        filter.startDate.$lte = query.startDateTo;
      }
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { markdownDescription: { $regex: query.search, $options: 'i' } },
        { projectName: { $regex: query.search, $options: 'i' } },
        { workstreamName: { $regex: query.search, $options: 'i' } },
      ];
    }

    return filter;
  }

  private applyTaskFilters(
    scopedFilter: TaskQueryFilter,
    query: QueryTaskDto,
  ): TaskQueryFilter {
    const filter: TaskQueryFilter = { ...scopedFilter };

    if (query.status?.length) {
      filter.status = { $in: query.status };
    }

    if (query.priority) {
      filter.priority = query.priority;
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.tags?.length) {
      filter.tags = { $in: query.tags };
    }

    if (query.assigneeIds?.length) {
      filter['assignees.id'] = {
        $in: query.assigneeIds.map((assigneeId) => toObjectId(assigneeId)),
      };
    }

    if (query.parentTaskId) {
      filter.parentTaskId = toObjectId(query.parentTaskId);
    }

    return filter;
  }

  private async getFilterCounts(
    scopedFilter: TaskQueryFilter,
  ): Promise<TaskFilterCounts> {
    const [result] = await this.taskModel
      .aggregate([
        { $match: scopedFilter },
        {
          $facet: {
            status: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            priority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
            tags: [
              {
                $match: {
                  tags: { $exists: true, $ne: [] },
                },
              },
              { $unwind: '$tags' },
              { $group: { _id: '$tags', count: { $sum: 1 } } },
            ],
            members: [
              {
                $unwind: {
                  path: '$assignees',
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $group: {
                  _id: {
                    $ifNull: ['$assignees.name', 'unassigned'],
                  },
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ])
      .exec();

    return {
      status: this.toCountsRecord(result?.status ?? [], (key) =>
        this.normalizeStatusValue(key),
      ),
      priority: this.toCountsRecord(result?.priority ?? [], (key) =>
        this.normalizePriorityValue(key),
      ),
      tags: this.toCountsRecord(result?.tags ?? []),
      members: this.toCountsRecord(result?.members ?? []),
    };
  }

  private toCountsRecord(
    items: Array<{ _id: string | null; count: number }>,
    normalizeKey?: (value: string) => string,
  ): Record<string, number> {
    return items.reduce<Record<string, number>>((acc, item) => {
      if (!item._id) {
        return acc;
      }

      const key = normalizeKey ? normalizeKey(item._id) : item._id;
      acc[key] = item.count;
      return acc;
    }, {});
  }

  private buildSort(query: QueryTaskDto): Record<string, SortOrder> {
    const sortFieldMap: Record<string, string> = {
      name: 'name',
      status: 'status',
      priority: 'priority',
      startDate: 'startDate',
      dueDate: 'dueDate',
      dueDateTime: 'dueDateTime',
      type: 'type',
      projectName: 'projectName',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    };

    const sortField = query.sortBy
      ? (sortFieldMap[query.sortBy] ?? 'createdAt')
      : 'createdAt';
    const sortOrder: SortOrder = query.sortOrder === 'asc' ? 1 : -1;

    return sortField === 'createdAt'
      ? { createdAt: sortOrder }
      : { [sortField]: sortOrder, createdAt: -1 };
  }

  private normalizeStatusValue(value: string): string {
    if (value === 'in_progress') {
      return TaskStatus.IN_PROGRESS;
    }

    return value;
  }

  private normalizePriorityValue(value: string): string {
    if (!Number.isNaN(Number(value))) {
      switch (Number(value)) {
        case 1:
          return TaskPriority.LOW;
        case 2:
          return TaskPriority.MEDIUM;
        case 3:
          return TaskPriority.HIGH;
        case 4:
          return TaskPriority.URGENT;
        default:
          return TaskPriority.NONE;
      }
    }

    return value;
  }

  private async getNextProjectOrders(
    workspaceId: string | Types.ObjectId,
    projectId: string,
    workstreamId?: string,
  ): Promise<TaskOrderValues> {
    const workstreamFilter =
      workstreamId !== undefined
        ? workstreamId
        : ({ $in: [null, ''] } as const);

    const [projectTask] = await this.taskModel
      .find({
        projectId,
        ...this.buildWorkspaceOnlyFilter(workspaceId),
      })
      .sort({ projectOrder: -1, createdAt: -1 })
      .limit(1)
      .exec();

    const [workstreamTask] = await this.taskModel
      .find({
        projectId,
        workstreamId: workstreamFilter,
        ...this.buildWorkspaceOnlyFilter(workspaceId),
      })
      .sort({ workstreamOrder: -1, createdAt: -1 })
      .limit(1)
      .exec();

    return {
      projectOrder: (projectTask?.projectOrder ?? -1) + 1,
      workstreamOrder: (workstreamTask?.workstreamOrder ?? -1) + 1,
    };
  }

  private buildWorkspaceOnlyFilter(
    workspaceId: string | Types.ObjectId,
  ): Record<string, unknown> {
    return {
      $or: [
        { workspaceId: toObjectId(workspaceId) },
        { workspaceId: { $exists: false } },
        { workspaceId: null },
      ],
    };
  }

  private getAssigneeCompatFields(
    input: Pick<TaskPersistenceInput, 'assignee' | 'assignees'>,
  ): {
    assignee: TaskAssigneeSnapshot | null;
    assignees: TaskAssigneeSnapshot[];
    assigneeId: Types.ObjectId | null;
    assigneeIds: Types.ObjectId[];
  } {
    const assignees =
      input.assignees ?? (input.assignee ? [input.assignee] : []);
    const assignee = assignees[0] ?? input.assignee ?? null;

    return {
      assignee,
      assignees,
      assigneeId: assignee?.id ? toObjectId(assignee.id) : null,
      assigneeIds: assignees.map((item) => toObjectId(item.id)),
    };
  }

  private getTagCompatFields(
    input: Pick<TaskPersistenceInput, 'tag' | 'tags'>,
  ): { tag?: string; tags: string[] } {
    const tags = input.tags ?? (input.tag ? [input.tag] : []);

    return {
      tag: tags[0] ?? input.tag,
      tags,
    };
  }
}
