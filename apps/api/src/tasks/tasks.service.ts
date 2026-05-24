import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
import {
  MyTasksResultDto,
  TaskActivityEntryResponseDto,
  TaskAssigneeResponseDto,
  TaskChecklistItemResponseDto,
  TaskChecklistResponseDto,
  TaskCommentResponseDto,
  TaskCustomFieldResponseDto,
  TaskDependencyResponseDto,
  TaskResponseDto,
} from './dto/task-response.dto';
import { TasksRepository } from './tasks.repository';
import {
  TaskActivityAction,
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
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import {
  AddTaskCommentDto,
  DuplicateTaskDto,
  MoveTaskDto,
} from './dto/task-action.dto';
import { CreateCustomStatusDto, LogTimeDto } from './dto/advanced-tasks.dto';
import { UsersService } from '../users/users.service';
import { ProjectsService } from '../projects/projects.service';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CustomStatus,
  CustomStatusDocument,
} from './schemas/custom-status.schema';
import { TimeLog, TimeLogDocument } from './schemas/time-log.schema';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly tasksRepo: TasksRepository,
    private readonly usersService: UsersService,
    private readonly projectsService: ProjectsService,
    private readonly eventEmitter: EventEmitter2,
    @InjectModel(CustomStatus.name)
    private customStatusModel: Model<CustomStatusDocument>,
    @InjectModel(TimeLog.name) private timeLogModel: Model<TimeLogDocument>,
  ) {}

  async create(
    workspace: WorkspaceRequestContext,
    dto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    const assignees = await this.resolveUserSnapshots(
      dto.assigneeIds ?? (dto.assigneeId ? [dto.assigneeId] : []),
    );
    const watchers = await this.resolveUserSnapshots(dto.watcherIds ?? []);
    const status = dto.status ?? TaskStatus.TODO;
    const projectContext = await this.projectsService.resolveTaskProjectContext(
      workspace,
      dto.projectId,
      dto.workstreamId,
    );
    const actor = await this.usersService.findById(workspace.actorUserId);
    const scope = {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    };

    if (dto.parentTaskId) {
      await this.requireTask(dto.parentTaskId, scope);
    }

    const task = await this.tasksRepo.create(scope, {
      name: dto.name,
      projectId: projectContext.projectId,
      projectName: projectContext.projectName,
      workstreamId: projectContext.workstreamId,
      workstreamName: projectContext.workstreamName,
      assignee: assignees[0] ?? null,
      assignees,
      watchers,
      description: dto.description,
      markdownDescription: dto.markdownDescription,
      status,
      type: dto.type ?? TaskType.TASK,
      priority: dto.priority ?? TaskPriority.NONE,
      tag: dto.tag,
      tags: this.normalizeTags(dto.tags, dto.tag),
      startDate: dto.startDate,
      dueDate: dto.dueDate,
      dueDateTime: dto.dueDateTime,
      timeEstimateMinutes: dto.timeEstimateMinutes ?? 0,
      timeSpentMinutes: dto.timeSpentMinutes ?? 0,
      parentTaskId: dto.parentTaskId
        ? new Types.ObjectId(dto.parentTaskId)
        : null,
      subtaskIds: (dto.subtaskIds ?? []).map((id) => new Types.ObjectId(id)),
      checklists: this.toChecklistPersistence(dto.checklists),
      comments: this.toCommentPersistence(
        dto.comments,
        workspace.actorUserId,
        actor.displayName,
      ),
      customFields: this.toCustomFieldPersistence(dto.customFields),
      dependencies: this.toDependencyPersistence(dto.dependencies),
      activity: [
        this.createActivityEntry(
          workspace.actorUserId,
          TaskActivityAction.CREATED,
        ),
      ],
      completedAt: status === TaskStatus.DONE ? new Date() : null,
    });

    if (dto.parentTaskId) {
      await this.linkSubtaskToParent(
        dto.parentTaskId,
        task._id,
        workspace.actorUserId,
        scope,
      );
    }

    // Emit task assigned notification if assignee is different from creator
    for (const assignee of assignees) {
      if (assignee.id.toString() === workspace.actorUserId) {
        continue;
      }
      this.eventEmitter.emit('task.assigned', {
        taskId: task._id.toString(),
        taskName: dto.name,
        assignerId: workspace.actorUserId,
        assignerName: actor.displayName,
        assigneeId: assignee.id.toString(),
        workspaceId: workspace.workspaceId,
      });
    }

    return this.toTaskResponse(task);
  }

  async findByIdAndUser(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<TaskResponseDto> {
    const task = await this.tasksRepo.findByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.toTaskResponse(task);
  }

  async findMany(
    workspace: WorkspaceRequestContext,
    query: QueryTaskDto,
  ): Promise<MyTasksResultDto> {
    const { items, total, filterCounts } =
      await this.tasksRepo.findWithPaginationAndFilters(
        {
          workspaceId: workspace.workspaceId,
          userId: workspace.actorUserId,
        },
        query,
      );

    return {
      data: {
        tasks: items.map((task) => this.toTaskResponse(task)),
        pagination: {
          total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(total / query.limit),
        },
      },
      meta: {
        filterCounts,
      },
    };
  }

  async getMyTasks(
    workspace: WorkspaceRequestContext,
    query: QueryTaskDto,
  ): Promise<MyTasksResultDto> {
    return this.findMany(workspace, query);
  }

  async update(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    const scope = {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    };
    const existingTask = await this.tasksRepo.findByIdAndUser(id, scope);
    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    const updatePayload: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      updatePayload.name = dto.name;
    }

    if (dto.projectId !== undefined) {
      updatePayload.projectId = dto.projectId;
    }

    if (dto.description !== undefined) {
      updatePayload.description = dto.description;
    }

    if (dto.markdownDescription !== undefined) {
      updatePayload.markdownDescription = dto.markdownDescription;
    }

    if (dto.priority !== undefined) {
      updatePayload.priority = dto.priority;
    }

    if (dto.type !== undefined) {
      updatePayload.type = dto.type;
    }

    if (dto.tag !== undefined) {
      updatePayload.tag = dto.tag;
    }

    if (dto.tags !== undefined) {
      updatePayload.tags = this.normalizeTags(dto.tags, dto.tag);
    }

    if (dto.startDate !== undefined) {
      updatePayload.startDate = dto.startDate;
    }

    if (dto.dueDate !== undefined) {
      updatePayload.dueDate = dto.dueDate;
    }

    if (dto.dueDateTime !== undefined) {
      updatePayload.dueDateTime = dto.dueDateTime;
    }

    if (dto.timeEstimateMinutes !== undefined) {
      updatePayload.timeEstimateMinutes = dto.timeEstimateMinutes;
    }

    if (dto.timeSpentMinutes !== undefined) {
      updatePayload.timeSpentMinutes = dto.timeSpentMinutes;
    }

    if (dto.parentTaskId !== undefined) {
      if (dto.parentTaskId) {
        await this.requireTask(dto.parentTaskId, scope);
      }

      updatePayload.parentTaskId = dto.parentTaskId
        ? new Types.ObjectId(dto.parentTaskId)
        : null;
    }

    if (dto.subtaskIds !== undefined) {
      updatePayload.subtaskIds = dto.subtaskIds.map(
        (subtaskId) => new Types.ObjectId(subtaskId),
      );
    }

    if (dto.checklists !== undefined) {
      updatePayload.checklists = this.toChecklistPersistence(dto.checklists);
    }

    if (dto.comments !== undefined) {
      const actor = await this.usersService.findById(workspace.actorUserId);
      updatePayload.comments = this.toCommentPersistence(
        dto.comments,
        workspace.actorUserId,
        actor.displayName,
      );
    }

    if (dto.customFields !== undefined) {
      updatePayload.customFields = this.toCustomFieldPersistence(
        dto.customFields,
      );
    }

    if (dto.dependencies !== undefined) {
      updatePayload.dependencies = this.toDependencyPersistence(
        dto.dependencies,
      );
    }

    if ('assigneeIds' in dto || 'assigneeId' in dto) {
      const assigneeIds =
        dto.assigneeIds ?? (dto.assigneeId ? [dto.assigneeId] : []);
      const assignees = await this.resolveUserSnapshots(assigneeIds);
      updatePayload.assignees = assignees;
      updatePayload.assignee = assignees[0] ?? null;
    }

    if ('watcherIds' in dto) {
      updatePayload.watchers = await this.resolveUserSnapshots(
        dto.watcherIds ?? [],
      );
    }

    if (dto.projectId !== undefined || dto.workstreamId !== undefined) {
      const projectContext =
        await this.projectsService.resolveTaskProjectContext(
          workspace,
          dto.projectId ?? existingTask.projectId,
          dto.workstreamId ?? existingTask.workstreamId,
        );

      updatePayload.projectId = projectContext.projectId;
      updatePayload.projectName = projectContext.projectName;
      updatePayload.workstreamId = projectContext.workstreamId;
      updatePayload.workstreamName = projectContext.workstreamName;
    }

    if (dto.status !== undefined) {
      updatePayload.status = dto.status;
      updatePayload.completedAt =
        dto.status === TaskStatus.DONE
          ? (dto.completedAt ?? existingTask.completedAt ?? new Date())
          : null;
    } else if (dto.completedAt !== undefined) {
      updatePayload.completedAt = dto.completedAt;
    }

    const updatedTask = await this.tasksRepo.updateByIdAndUser(id, scope, {
      $set: updatePayload,
      $push: {
        activity: this.createActivityEntry(
          workspace.actorUserId,
          TaskActivityAction.UPDATED,
        ),
      },
    });

    if (!updatedTask) {
      throw new NotFoundException('Task not found');
    }

    if (dto.parentTaskId !== undefined) {
      await this.moveSubtaskParent(
        existingTask.parentTaskId ?? null,
        dto.parentTaskId,
        updatedTask._id,
        workspace.actorUserId,
        scope,
      );
    }

    if (dto.status && dto.status !== existingTask.status) {
      this.eventEmitter.emit('task.status_changed', {
        taskId: id,
        userId: workspace.actorUserId,
        oldStatus: this.normalizeStatus(existingTask.status),
        newStatus: dto.status,
      });
    }

    // Emit task assigned notification if assignee changed
    if (
      ('assigneeIds' in dto || 'assigneeId' in dto) &&
      updatePayload.assignees
    ) {
      const newAssigneeIds = (
        updatePayload.assignees as TaskAssigneeSnapshot[]
      ).map((assignee) => assignee.id.toString());
      const oldAssigneeIds = (
        existingTask.assignees?.length
          ? existingTask.assignees
          : existingTask.assignee
            ? [existingTask.assignee]
            : []
      ).map((assignee) => assignee.id.toString());

      // Only notify if assignee actually changed and is different from updater
      const newlyAssignedIds = newAssigneeIds.filter(
        (assigneeId) =>
          !oldAssigneeIds.includes(assigneeId) &&
          assigneeId !== workspace.actorUserId,
      );

      if (newlyAssignedIds.length) {
        const assigner = await this.usersService.findById(
          workspace.actorUserId,
        );
        const taskName = dto.name ?? existingTask.name ?? 'Untitled Task';

        for (const assigneeId of newlyAssignedIds) {
          this.eventEmitter.emit('task.assigned', {
            taskId: id,
            taskName,
            assignerId: workspace.actorUserId,
            assignerName: assigner.displayName,
            assigneeId,
            workspaceId: workspace.workspaceId,
          });
        }
      }
    }

    return this.toTaskResponse(updatedTask);
  }

  async delete(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<{ message: string }> {
    const scope = {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    };
    const task = await this.tasksRepo.findByIdAndUser(id, scope);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const deleted = await this.tasksRepo.deleteByIdAndUser(id, scope);
    if (!deleted) {
      throw new NotFoundException('Task not found');
    }

    this.eventEmitter.emit('task.deleted', {
      taskId: id,
      userId: workspace.actorUserId,
    });

    this.logger.log(
      `Task ${id} deleted by user ${workspace.actorUserId} in workspace ${workspace.workspaceId}`,
    );

    return { message: 'Task deleted successfully' };
  }

  async archive(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<TaskResponseDto> {
    const updatedTask = await this.tasksRepo.updateByIdAndUser(
      id,
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      {
        $set: {
          status: TaskStatus.ARCHIVED,
          archivedAt: new Date(),
          archivedBy: new Types.ObjectId(workspace.actorUserId),
          completedAt: null,
        },
        $push: {
          activity: this.createActivityEntry(
            workspace.actorUserId,
            TaskActivityAction.ARCHIVED,
          ),
        },
      },
    );

    if (!updatedTask) {
      throw new NotFoundException('Task not found');
    }

    this.eventEmitter.emit('task.archived', {
      taskId: id,
      userId: workspace.actorUserId,
    });

    return this.toTaskResponse(updatedTask);
  }

  async restore(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<TaskResponseDto> {
    const updatedTask = await this.tasksRepo.updateByIdAndUser(
      id,
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      {
        $set: {
          status: TaskStatus.TODO,
          archivedAt: null,
          archivedBy: null,
        },
        $push: {
          activity: this.createActivityEntry(
            workspace.actorUserId,
            TaskActivityAction.RESTORED,
          ),
        },
      },
    );

    if (!updatedTask) {
      throw new NotFoundException('Task not found');
    }

    this.eventEmitter.emit('task.restored', {
      taskId: id,
      userId: workspace.actorUserId,
    });

    return this.toTaskResponse(updatedTask);
  }

  async duplicate(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: DuplicateTaskDto,
  ): Promise<TaskResponseDto> {
    const scope = {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    };
    const source = await this.tasksRepo.findByIdAndUser(id, scope);
    if (!source) {
      throw new NotFoundException('Task not found');
    }

    const targetContext = await this.projectsService.resolveTaskProjectContext(
      workspace,
      dto.projectId ?? source.projectId,
      dto.workstreamId ?? source.workstreamId,
    );

    const duplicate = await this.tasksRepo.create(scope, {
      name: dto.name ?? `${source.name} copy`,
      projectId: targetContext.projectId,
      projectName: targetContext.projectName,
      workstreamId: targetContext.workstreamId,
      workstreamName: targetContext.workstreamName,
      assignees: source.assignees ?? [],
      watchers: source.watchers ?? [],
      description: source.description,
      markdownDescription: source.markdownDescription,
      status: TaskStatus.TODO,
      type: source.type ?? TaskType.TASK,
      priority: source.priority,
      tags: source.tags ?? (source.tag ? [source.tag] : []),
      startDate: source.startDate,
      dueDate: source.dueDate,
      dueDateTime: source.dueDateTime,
      timeEstimateMinutes: source.timeEstimateMinutes ?? 0,
      timeSpentMinutes: 0,
      parentTaskId: source.parentTaskId ?? null,
      subtaskIds: [],
      checklists: source.checklists ?? [],
      customFields: source.customFields ?? [],
      dependencies: source.dependencies ?? [],
      activity: [
        this.createActivityEntry(
          workspace.actorUserId,
          TaskActivityAction.DUPLICATED,
          { sourceTaskId: id },
        ),
      ],
      duplicatedFromTaskId: new Types.ObjectId(id),
      completedAt: null,
    });

    this.eventEmitter.emit('task.duplicated', {
      taskId: duplicate._id.toString(),
      sourceTaskId: id,
      userId: workspace.actorUserId,
    });

    return this.toTaskResponse(duplicate);
  }

  async move(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: MoveTaskDto,
  ): Promise<TaskResponseDto> {
    const existingTask = await this.tasksRepo.findByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    const projectContext = await this.projectsService.resolveTaskProjectContext(
      workspace,
      dto.projectId,
      dto.workstreamId,
    );

    const updatePayload: Record<string, unknown> = {
      projectId: projectContext.projectId,
      projectName: projectContext.projectName,
      workstreamId: projectContext.workstreamId,
      workstreamName: projectContext.workstreamName,
    };

    if (dto.targetOrder !== undefined) {
      updatePayload.projectOrder = dto.targetOrder;
      updatePayload.workstreamOrder = dto.targetOrder;
    }

    const movedTask = await this.tasksRepo.updateByIdAndUser(
      id,
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      {
        $set: updatePayload,
        $push: {
          activity: this.createActivityEntry(
            workspace.actorUserId,
            TaskActivityAction.MOVED,
            {
              fromProjectId: existingTask.projectId,
              toProjectId: projectContext.projectId,
              fromWorkstreamId: existingTask.workstreamId,
              toWorkstreamId: projectContext.workstreamId,
            },
          ),
        },
      },
    );

    if (!movedTask) {
      throw new NotFoundException('Task not found');
    }

    this.eventEmitter.emit('task.moved', {
      taskId: id,
      userId: workspace.actorUserId,
      projectId: projectContext.projectId,
      workstreamId: projectContext.workstreamId,
    });

    return this.toTaskResponse(movedTask);
  }

  async addComment(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: AddTaskCommentDto,
  ): Promise<TaskResponseDto> {
    const actor = await this.usersService.findById(workspace.actorUserId);
    const [comment] = this.toCommentPersistence(
      [dto],
      workspace.actorUserId,
      actor.displayName,
    );

    const updatedTask = await this.tasksRepo.updateByIdAndUser(
      id,
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      {
        $push: {
          comments: comment,
          activity: this.createActivityEntry(
            workspace.actorUserId,
            TaskActivityAction.COMMENTED,
            { mentionIds: dto.mentionIds ?? [] },
          ),
        },
      },
    );

    if (!updatedTask) {
      throw new NotFoundException('Task not found');
    }

    this.eventEmitter.emit('task.commented', {
      taskId: id,
      userId: workspace.actorUserId,
      mentionIds: dto.mentionIds ?? [],
    });

    return this.toTaskResponse(updatedTask);
  }

  async getTaskOverview(workspace: WorkspaceRequestContext) {
    return this.tasksRepo.getTaskOverview({
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
  }

  // --- Advanced Methods: Time Tracking ---

  async logTime(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: LogTimeDto,
  ) {
    // Verify task exists and user has access
    const task = await this.requireTask(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });

    const timeLog = await this.timeLogModel.create({
      workspaceId: new Types.ObjectId(workspace.workspaceId),
      taskId: new Types.ObjectId(id),
      userId: new Types.ObjectId(workspace.actorUserId),
      durationMin: dto.durationMin,
      description: dto.description,
    });

    // Update total time spent on task
    await this.tasksRepo.updateByIdAndUser(
      id,
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      {
        $inc: { timeSpentMinutes: dto.durationMin },
      },
    );

    return timeLog;
  }

  async getTimeLogs(id: string, workspace: WorkspaceRequestContext) {
    // Verify task exists
    await this.requireTask(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });

    return this.timeLogModel
      .find({
        workspaceId: new Types.ObjectId(workspace.workspaceId),
        taskId: new Types.ObjectId(id),
      })
      .sort({ loggedAt: -1 })
      .exec();
  }

  async deleteTimeLog(
    id: string,
    logId: string,
    workspace: WorkspaceRequestContext,
  ) {
    const timeLog = await this.timeLogModel.findOneAndDelete({
      _id: new Types.ObjectId(logId),
      workspaceId: new Types.ObjectId(workspace.workspaceId),
      taskId: new Types.ObjectId(id),
      // Optional: uncomment below if users can only delete their own time logs
      // userId: new Types.ObjectId(workspace.actorUserId),
    });

    if (!timeLog) {
      throw new NotFoundException('Time log not found');
    }

    // Decrement total time spent
    await this.tasksRepo.updateByIdAndUser(
      id,
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      {
        $inc: { timeSpentMinutes: -timeLog.durationMin },
      },
    );

    return { message: 'Time log deleted successfully' };
  }

  // --- Advanced Methods: Custom Statuses ---

  async createCustomStatus(
    workspace: WorkspaceRequestContext,
    dto: CreateCustomStatusDto,
  ) {
    const status = await this.customStatusModel.create({
      workspaceId: new Types.ObjectId(workspace.workspaceId),
      name: dto.name,
      color: dto.color,
      order: dto.order,
      isCompletedStatus: dto.isCompletedStatus ?? false,
    });

    return status;
  }

  async getCustomStatuses(workspace: WorkspaceRequestContext) {
    return this.customStatusModel
      .find({
        workspaceId: new Types.ObjectId(workspace.workspaceId),
      })
      .sort({ order: 1 })
      .exec();
  }

  private async requireTask(
    id: string,
    scope: { workspaceId: string; userId: string },
  ): Promise<TaskDocument> {
    const task = await this.tasksRepo.findByIdAndUser(id, scope);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private async linkSubtaskToParent(
    parentTaskId: string,
    subtaskId: Types.ObjectId,
    actorUserId: string,
    scope: { workspaceId: string; userId: string },
  ): Promise<void> {
    await this.tasksRepo.updateByIdAndUser(parentTaskId, scope, {
      $addToSet: { subtaskIds: subtaskId },
      $push: {
        activity: this.createActivityEntry(
          actorUserId,
          TaskActivityAction.UPDATED,
          { subtaskId: subtaskId.toString() },
        ),
      },
    });
  }

  private async moveSubtaskParent(
    previousParentTaskId: Types.ObjectId | null,
    nextParentTaskId: string | undefined,
    subtaskId: Types.ObjectId,
    actorUserId: string,
    scope: { workspaceId: string; userId: string },
  ): Promise<void> {
    const previousParent = previousParentTaskId?.toString();
    if (previousParent === nextParentTaskId) {
      return;
    }

    if (previousParent) {
      await this.tasksRepo.updateByIdAndUser(previousParent, scope, {
        $pull: { subtaskIds: subtaskId },
      });
    }

    if (nextParentTaskId) {
      await this.linkSubtaskToParent(
        nextParentTaskId,
        subtaskId,
        actorUserId,
        scope,
      );
    }
  }

  private async resolveUserSnapshots(
    userIds: string[],
  ): Promise<TaskAssigneeSnapshot[]> {
    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
    if (!uniqueUserIds.length) {
      return [];
    }

    const users = await this.usersService.findByIds(uniqueUserIds);
    if (users.length !== uniqueUserIds.length) {
      throw new NotFoundException('One or more users not found');
    }

    return users.map((user) => ({
      id: new Types.ObjectId(user.id),
      name: user.displayName,
      avatarUrl: undefined,
      role: undefined,
    }));
  }

  private normalizeTags(tags?: string[], legacyTag?: string): string[] {
    const nextTags = tags ?? (legacyTag ? [legacyTag] : []);

    return Array.from(
      new Set(nextTags.map((tag) => tag.trim()).filter(Boolean)),
    );
  }

  private toChecklistPersistence(
    checklists?: CreateTaskDto['checklists'],
  ): TaskChecklist[] {
    return (checklists ?? []).map((checklist) => ({
      title: checklist.title,
      items: (checklist.items ?? []).map((item) => ({
        text: item.text,
        checked: item.checked ?? false,
        completedAt: item.checked ? new Date() : null,
        completedBy: null,
      })),
    }));
  }

  private toCommentPersistence(
    comments: CreateTaskDto['comments'],
    actorUserId: string,
    actorName: string,
  ): TaskComment[] {
    return (comments ?? []).map((comment) => ({
      authorId: new Types.ObjectId(actorUserId),
      authorName: actorName,
      markdown: comment.markdown,
      mentionIds: (comment.mentionIds ?? []).map(
        (mentionId) => new Types.ObjectId(mentionId),
      ),
      createdAt: new Date(),
    }));
  }

  private toCustomFieldPersistence(
    customFields?: CreateTaskDto['customFields'],
  ): TaskCustomField[] {
    return (customFields ?? []).map((field) => ({
      key: field.key,
      label: field.label,
      type: field.type,
      value: field.value,
    }));
  }

  private toDependencyPersistence(
    dependencies?: CreateTaskDto['dependencies'],
  ): TaskDependency[] {
    return (dependencies ?? []).map((dependency) => ({
      taskId: new Types.ObjectId(dependency.taskId),
      type: dependency.type,
    }));
  }

  private createActivityEntry(
    actorId: string,
    action: TaskActivityAction,
    details: Record<string, unknown> = {},
  ) {
    return {
      action,
      actorId: new Types.ObjectId(actorId),
      details,
      createdAt: new Date(),
    };
  }

  private toTaskResponse(task: TaskDocument): TaskResponseDto {
    const raw = task.toObject() as TaskDocument & {
      _id: Types.ObjectId;
      title?: string;
    };

    const assignees = (
      Array.isArray(raw.assignees) && raw.assignees.length
        ? raw.assignees
        : raw.assignee
          ? [raw.assignee]
          : []
    ).map((assignee) => this.toUserSnapshotResponse(assignee));
    const rawTags = (raw as { tags?: Array<string | { name?: string }> }).tags;
    const tags = Array.isArray(rawTags)
      ? rawTags
          .map((tag) => (typeof tag === 'string' ? tag : tag?.name))
          .filter((tag): tag is string => Boolean(tag))
      : raw.tag
        ? [raw.tag]
        : [];

    return new TaskResponseDto({
      id: this.stringifyObjectId(raw._id),
      workspaceId: raw.workspaceId
        ? this.stringifyObjectId(raw.workspaceId)
        : '',
      name: raw.name ?? raw.title ?? '',
      status: this.normalizeStatus(raw.status),
      type: raw.type ?? TaskType.TASK,
      projectId: raw.projectId ?? 'personal',
      projectName: raw.projectName ?? 'Personal',
      workstreamId: raw.workstreamId,
      workstreamName: raw.workstreamName,
      assignee: assignees[0],
      assignees,
      watchers: (raw.watchers ?? []).map((watcher) =>
        this.toUserSnapshotResponse(watcher),
      ),
      startDate: raw.startDate ?? raw.dueDate,
      priority: this.normalizePriority(raw.priority),
      tag: raw.tag ?? tags[0],
      tags,
      description: raw.description,
      markdownDescription: raw.markdownDescription,
      dueDate: raw.dueDate,
      dueDateTime: raw.dueDateTime,
      timeEstimateMinutes: raw.timeEstimateMinutes ?? 0,
      timeSpentMinutes: raw.timeSpentMinutes ?? 0,
      parentTaskId: raw.parentTaskId
        ? this.stringifyObjectId(raw.parentTaskId)
        : null,
      subtaskIds: (raw.subtaskIds ?? []).map((subtaskId) =>
        this.stringifyObjectId(subtaskId),
      ),
      checklists: (raw.checklists ?? []).map((checklist) =>
        this.toChecklistResponse(checklist),
      ),
      comments: (raw.comments ?? []).map((comment) =>
        this.toCommentResponse(comment),
      ),
      customFields: (raw.customFields ?? []).map(
        (field) => new TaskCustomFieldResponseDto(field),
      ),
      dependencies: (raw.dependencies ?? []).map(
        (dependency) =>
          new TaskDependencyResponseDto({
            taskId: this.stringifyObjectId(dependency.taskId),
            type: dependency.type,
          }),
      ),
      activity: (raw.activity ?? []).map(
        (activity) =>
          new TaskActivityEntryResponseDto({
            action: activity.action,
            actorId: this.stringifyObjectId(activity.actorId),
            details: activity.details,
            createdAt: activity.createdAt,
          }),
      ),
      completedAt: raw.completedAt ?? null,
      archivedAt: raw.archivedAt ?? null,
      archivedBy: raw.archivedBy
        ? this.stringifyObjectId(raw.archivedBy)
        : null,
      duplicatedFromTaskId: raw.duplicatedFromTaskId
        ? this.stringifyObjectId(raw.duplicatedFromTaskId)
        : null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  private toUserSnapshotResponse(
    snapshot: TaskAssigneeSnapshot,
  ): TaskAssigneeResponseDto {
    return new TaskAssigneeResponseDto({
      id: this.stringifyObjectId(snapshot.id),
      name: snapshot.name,
      avatarUrl: snapshot.avatarUrl,
      role: snapshot.role,
    });
  }

  private toChecklistResponse(
    checklist: TaskChecklist,
  ): TaskChecklistResponseDto {
    const checklistWithId = checklist as TaskChecklist & {
      _id?: Types.ObjectId;
    };

    return new TaskChecklistResponseDto({
      id: this.stringifyObjectId(checklistWithId._id),
      title: checklist.title,
      items: (checklist.items ?? []).map((item) => {
        const itemWithId = item as typeof item & { _id?: Types.ObjectId };

        return new TaskChecklistItemResponseDto({
          id: this.stringifyObjectId(itemWithId._id),
          text: item.text,
          checked: item.checked,
          completedBy: item.completedBy
            ? this.stringifyObjectId(item.completedBy)
            : null,
          completedAt: item.completedAt ?? null,
        });
      }),
    });
  }

  private toCommentResponse(comment: TaskComment): TaskCommentResponseDto {
    const commentWithId = comment as TaskComment & { _id?: Types.ObjectId };

    return new TaskCommentResponseDto({
      id: this.stringifyObjectId(commentWithId._id),
      authorId: this.stringifyObjectId(comment.authorId),
      authorName: comment.authorName,
      markdown: comment.markdown,
      mentionIds: (comment.mentionIds ?? []).map((mentionId) =>
        this.stringifyObjectId(mentionId),
      ),
      createdAt: comment.createdAt,
    });
  }

  private normalizeStatus(status?: TaskStatus | string): TaskStatus {
    if (status === 'in_progress') {
      return TaskStatus.IN_PROGRESS;
    }

    if (status === TaskStatus.ARCHIVED) {
      return TaskStatus.ARCHIVED;
    }

    return (status as TaskStatus) ?? TaskStatus.TODO;
  }

  private normalizePriority(
    priority?: TaskPriority | number | string,
  ): TaskPriority {
    if (typeof priority === 'number' || !Number.isNaN(Number(priority))) {
      switch (Number(priority)) {
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

    return (priority as TaskPriority) ?? TaskPriority.NONE;
  }

  private stringifyObjectId(value?: Types.ObjectId | string): string {
    if (!value) {
      return '';
    }

    return value instanceof Types.ObjectId ? value.toString() : value;
  }
}
