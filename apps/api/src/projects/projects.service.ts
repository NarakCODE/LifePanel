import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsRepository } from './projects.repository';
import { ProjectsMapper } from './projects.mapper';
import {
  PROJECT_EVENTS,
  ProjectCreatedEvent,
  ProjectDeletedEvent,
  ProjectTaskMovedEvent,
  ProjectTasksReorderedEvent,
  ProjectUpdatedEvent,
  ProjectWorkstreamTasksReorderedEvent,
} from './events/project.events';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import {
  ProjectDocument,
} from './schemas/project.schema';
import { UsersService } from '../users/users.service';
import { TasksRepository } from '../tasks/tasks.repository';
import {
  TaskAssigneeSnapshot,
  TaskDocument,
  TaskStatus,
} from '../tasks/schemas/task.schema';
import { UpdateTaskDto } from '../tasks/dto/update-task.dto';
import { TaskResponseDto } from '../tasks/dto/task-response.dto';
import { MoveProjectTaskDto } from './dto/move-project-task.dto';
import { ReorderProjectTasksDto } from './dto/reorder-project-tasks.dto';
import { ProjectDetailsResponseDto } from './dto/project-details-response.dto';
import { ResolvedTaskProjectContext } from './dto/project-response.dto';
import { RedisCacheService } from '../redis/redis-cache.service';
import { AuditService } from '../common/audit/audit.service';

/** Cache TTLs (seconds) */
const CACHE_TTL = {
  PROJECT_LIST: 120,    // 2 min — updated frequently
  PROJECT_DETAILS: 60,  // 1 min — aggregated, heavier query
  PROJECT_OVERVIEW: 300, // 5 min — dashboard stat, changes less often
} as const;

const CACHE_MODULE = 'projects';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly projectsRepo: ProjectsRepository,
    private readonly tasksRepo: TasksRepository,
    private readonly usersService: UsersService,
    private readonly mapper: ProjectsMapper,
    private readonly events: EventEmitter2,
    private readonly cache: RedisCacheService,
    private readonly audit: AuditService,
  ) {}

  // ── Create ───────────────────────────────────────────────────────────────

  async create(
    workspace: WorkspaceRequestContext,
    dto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsRepo.create(
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      dto,
    );

    const response = this.mapper.toProjectResponse(project);

    // (arch-use-events) emit domain event
    this.events.emit(PROJECT_EVENTS.CREATED, {
      projectId: response.id,
      workspaceId: workspace.workspaceId,
      actorUserId: workspace.actorUserId,
      name: response.name,
    } satisfies ProjectCreatedEvent);

    // (devops-use-logging) structured audit trail
    this.audit.log(workspace.actorUserId, 'project.create', {
      projectId: response.id,
      workspaceId: workspace.workspaceId,
      name: dto.name,
    });

    // (perf-use-caching) invalidate list cache for workspace
    await this.cache.deleteByPattern(
      CACHE_MODULE,
      `list:${workspace.workspaceId}`,
    );

    return response;
  }

  // ── Read ─────────────────────────────────────────────────────────────────

  async findAllAccessible(
    workspace: WorkspaceRequestContext,
  ): Promise<ProjectResponseDto[]> {
    const cacheId = `${workspace.workspaceId}:${workspace.actorUserId}`;

    return this.cache.getOrSet(
      CACHE_MODULE,
      'list',
      cacheId,
      async () => {
        const projects = await this.projectsRepo.findAllAccessible({
          workspaceId: workspace.workspaceId,
          userId: workspace.actorUserId,
        });
        return projects.map((project) =>
          this.mapper.toProjectResponse(project),
        );
      },
      CACHE_TTL.PROJECT_LIST,
    );
  }

  async findByIdAccessible(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsRepo.findAccessibleById(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.mapper.toProjectResponse(project);
  }

  async getDetails(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<ProjectDetailsResponseDto> {
    const cacheId = `${workspace.workspaceId}:${id}`;

    return this.cache.getOrSet(
      CACHE_MODULE,
      'details',
      cacheId,
      async () => this.fetchDetails(id, workspace),
      CACHE_TTL.PROJECT_DETAILS,
    );
  }

  async getProjectOverview(workspace: WorkspaceRequestContext) {
    const cacheId = `${workspace.workspaceId}:${workspace.actorUserId}`;

    return this.cache.getOrSet(
      CACHE_MODULE,
      'overview',
      cacheId,
      () =>
        this.projectsRepo.getProjectOverview({
          workspaceId: workspace.workspaceId,
          userId: workspace.actorUserId,
        }),
      CACHE_TTL.PROJECT_OVERVIEW,
    );
  }

  // ── Update ───────────────────────────────────────────────────────────────

  async update(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    const existingProject = await this.projectsRepo.findAccessibleById(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!existingProject) {
      throw new NotFoundException('Project not found');
    }

    const update: Partial<ProjectDocument> = {};
    const changes: string[] = [];

    if (dto.name !== undefined) {
      update.name = dto.name;
      changes.push('name');
    }

    if (dto.status !== undefined) {
      update.status = dto.status;
      changes.push('status');
    }

    if (dto.priority !== undefined) {
      update.priority = dto.priority;
      changes.push('priority');
    }

    if (dto.typeLabel !== undefined) {
      update.typeLabel = dto.typeLabel;
      changes.push('typeLabel');
    }

    if (dto.durationLabel !== undefined) {
      update.durationLabel = dto.durationLabel;
      changes.push('durationLabel');
    }

    if (dto.memberUserIds !== undefined) {
      update.memberUserIds = dto.memberUserIds.map(
        (memberId) => new Types.ObjectId(memberId),
      );
      changes.push('memberUserIds');
    }

    if (dto.workstreams !== undefined) {
      update.workstreams = dto.workstreams.map((workstream, index) => {
        const existing = existingProject.workstreams[index];

        return {
          _id: existing?._id ?? new Types.ObjectId(),
          name: workstream.name,
          order: workstream.order ?? index,
          archivedAt: existing?.archivedAt ?? null,
        };
      });
      changes.push('workstreams');
    }

    const project = await this.projectsRepo.updateByIdAndWorkspace(
      id,
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      update,
    );

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const response = this.mapper.toProjectResponse(project);

    this.events.emit(PROJECT_EVENTS.UPDATED, {
      projectId: id,
      workspaceId: workspace.workspaceId,
      actorUserId: workspace.actorUserId,
      changes,
    } satisfies ProjectUpdatedEvent);

    this.audit.log(workspace.actorUserId, 'project.update', {
      projectId: id,
      workspaceId: workspace.workspaceId,
      changes,
    });

    // Invalidate relevant caches
    await Promise.all([
      this.cache.deleteByPattern(CACHE_MODULE, `list:${workspace.workspaceId}`),
      this.cache.delete(
        CACHE_MODULE,
        'details',
        `${workspace.workspaceId}:${id}`,
      ),
      this.cache.delete(
        CACHE_MODULE,
        'list',
        `${workspace.workspaceId}:${workspace.actorUserId}`,
      ),
    ]);

    return response;
  }

  async updateProjectTask(
    projectId: string,
    taskId: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    await this.requireAccessibleProject(projectId, workspace);

    const existingTask = await this.tasksRepo.findByIdInProject(
      taskId,
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      projectId,
    );
    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    const updatePayload: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      updatePayload.name = dto.name;
    }

    if (dto.description !== undefined) {
      updatePayload.description = dto.description;
    }

    if (dto.priority !== undefined) {
      updatePayload.priority = dto.priority;
    }

    if (dto.tag !== undefined) {
      updatePayload.tag = dto.tag;
    }

    if (dto.startDate !== undefined) {
      updatePayload.startDate = dto.startDate;
    }

    if (dto.dueDate !== undefined) {
      updatePayload.dueDate = dto.dueDate;
    }

    if ('assigneeId' in dto) {
      updatePayload.assignee = await this.resolveAssigneeSnapshot(
        dto.assigneeId,
      );
    }

    if (dto.workstreamId !== undefined) {
      const projectContext = await this.resolveTaskProjectContext(
        workspace,
        projectId,
        dto.workstreamId,
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

    const updatedTask = await this.tasksRepo.updateByIdInProject(
      taskId,
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      projectId,
      {
        $set: updatePayload,
      },
    );

    if (!updatedTask) {
      throw new NotFoundException('Task not found');
    }

    // Invalidate project details cache after task mutation
    await this.cache.delete(
      CACHE_MODULE,
      'details',
      `${workspace.workspaceId}:${projectId}`,
    );

    return this.mapper.toTaskResponse(updatedTask);
  }

  async moveProjectTask(
    projectId: string,
    taskId: string,
    workspace: WorkspaceRequestContext,
    dto: MoveProjectTaskDto,
  ): Promise<TaskResponseDto> {
    const project = await this.requireAccessibleProject(projectId, workspace);
    const task = await this.tasksRepo.findByIdInProject(
      taskId,
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      projectId,
    );
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const targetContext = dto.targetWorkstreamId
      ? await this.resolveTaskProjectContext(
          workspace,
          projectId,
          dto.targetWorkstreamId,
        )
      : {
          projectId: project.id,
          projectName: project.name,
          workstreamId: undefined,
          workstreamName: undefined,
        };

    const tasks = await this.tasksRepo.findByProject(
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      projectId,
    );

    const sourceWorkstreamId = task.workstreamId ?? null;
    const targetWorkstreamId = targetContext.workstreamId ?? null;
    const sourceTaskIds = this.mapper
      .sortByWorkstreamOrder(
        tasks.filter(
          (item) =>
            item.id !== task.id &&
            (item.workstreamId ?? null) === sourceWorkstreamId,
        ),
      )
      .map((item) => item.id);
    const targetTaskIds = this.mapper
      .sortByWorkstreamOrder(
        tasks.filter(
          (item) =>
            item.id !== task.id &&
            (item.workstreamId ?? null) === targetWorkstreamId,
        ),
      )
      .map((item) => item.id);

    const insertionIndex = Math.min(
      Math.max(dto.targetOrder ?? targetTaskIds.length, 0),
      targetTaskIds.length,
    );
    targetTaskIds.splice(insertionIndex, 0, task.id);

    const movedTask = await this.tasksRepo.updateByIdInProject(
      taskId,
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      projectId,
      {
        $set: {
          projectId: targetContext.projectId,
          projectName: targetContext.projectName,
          workstreamId: targetContext.workstreamId,
          workstreamName: targetContext.workstreamName,
          workstreamOrder: insertionIndex,
        },
      },
    );

    if (!movedTask) {
      throw new NotFoundException('Task not found');
    }

    if (sourceWorkstreamId && sourceTaskIds.length > 0) {
      await this.tasksRepo.reorderWorkstreamTasks(
        {
          workspaceId: workspace.workspaceId,
          userId: workspace.actorUserId,
        },
        projectId,
        sourceWorkstreamId,
        sourceTaskIds,
      );
    }

    if (targetContext.workstreamId) {
      await this.tasksRepo.reorderWorkstreamTasks(
        {
          workspaceId: workspace.workspaceId,
          userId: workspace.actorUserId,
        },
        projectId,
        targetContext.workstreamId,
        targetTaskIds,
      );
    }

    this.events.emit(PROJECT_EVENTS.TASK_MOVED, {
      projectId,
      taskId,
      workspaceId: workspace.workspaceId,
      actorUserId: workspace.actorUserId,
      targetWorkstreamId: dto.targetWorkstreamId,
      targetOrder: dto.targetOrder,
    } satisfies ProjectTaskMovedEvent);

    await this.cache.delete(
      CACHE_MODULE,
      'details',
      `${workspace.workspaceId}:${projectId}`,
    );

    return this.mapper.toTaskResponse(movedTask);
  }

  async reorderProjectWorkstreamTasks(
    projectId: string,
    workstreamId: string,
    workspace: WorkspaceRequestContext,
    dto: ReorderProjectTasksDto,
  ): Promise<{ message: string }> {
    const project = await this.requireAccessibleProject(projectId, workspace);
    this.requireProjectWorkstream(project, workstreamId);

    const tasks = await this.tasksRepo.findByProject(
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      projectId,
    );
    const existingTaskIds = this.mapper
      .sortByWorkstreamOrder(
        tasks.filter((task) => task.workstreamId === workstreamId),
      )
      .map((task) => task.id);

    this.assertExactTaskIdSet(existingTaskIds, dto.taskIds, 'workstream');

    await this.tasksRepo.reorderWorkstreamTasks(
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      projectId,
      workstreamId,
      dto.taskIds,
    );

    this.events.emit(PROJECT_EVENTS.WORKSTREAM_TASKS_REORDERED, {
      projectId,
      workstreamId,
      workspaceId: workspace.workspaceId,
      actorUserId: workspace.actorUserId,
    } satisfies ProjectWorkstreamTasksReorderedEvent);

    await this.cache.delete(
      CACHE_MODULE,
      'details',
      `${workspace.workspaceId}:${projectId}`,
    );

    return { message: 'Tasks reordered successfully' };
  }

  async reorderProjectTasks(
    projectId: string,
    workspace: WorkspaceRequestContext,
    dto: ReorderProjectTasksDto,
  ): Promise<{ message: string }> {
    await this.requireAccessibleProject(projectId, workspace);

    const tasks = await this.tasksRepo.findByProject(
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      projectId,
    );
    const existingTaskIds = this.mapper
      .sortByProjectOrder(tasks)
      .map((task) => task.id);

    this.assertExactTaskIdSet(existingTaskIds, dto.taskIds, 'project');

    await this.tasksRepo.reorderProjectTasks(
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      projectId,
      dto.taskIds,
    );

    this.events.emit(PROJECT_EVENTS.TASKS_REORDERED, {
      projectId,
      workspaceId: workspace.workspaceId,
      actorUserId: workspace.actorUserId,
    } satisfies ProjectTasksReorderedEvent);

    await this.cache.delete(
      CACHE_MODULE,
      'details',
      `${workspace.workspaceId}:${projectId}`,
    );

    return { message: 'Project task order updated successfully' };
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  async delete(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<{ message: string }> {
    const deleted = await this.projectsRepo.deleteByIdAndWorkspace(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!deleted) {
      throw new NotFoundException('Project not found');
    }

    this.events.emit(PROJECT_EVENTS.DELETED, {
      projectId: id,
      workspaceId: workspace.workspaceId,
      actorUserId: workspace.actorUserId,
    } satisfies ProjectDeletedEvent);

    this.audit.log(workspace.actorUserId, 'project.delete', {
      projectId: id,
      workspaceId: workspace.workspaceId,
    });

    // Invalidate all related caches
    await Promise.all([
      this.cache.deleteByPattern(CACHE_MODULE, `list:${workspace.workspaceId}`),
      this.cache.delete(
        CACHE_MODULE,
        'details',
        `${workspace.workspaceId}:${id}`,
      ),
      this.cache.delete(
        CACHE_MODULE,
        'list',
        `${workspace.workspaceId}:${workspace.actorUserId}`,
      ),
      this.cache.delete(
        CACHE_MODULE,
        'overview',
        `${workspace.workspaceId}:${workspace.actorUserId}`,
      ),
    ]);

    return { message: 'Project deleted successfully' };
  }

  // ── Shared helper (used by TasksService via dependency) ──────────────────

  async resolveTaskProjectContext(
    workspace: WorkspaceRequestContext,
    projectId: string,
    workstreamId?: string,
  ): Promise<ResolvedTaskProjectContext> {
    const project = await this.projectsRepo.findAccessibleById(projectId, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!workstreamId) {
      return {
        projectId: project.id,
        projectName: project.name,
      };
    }

    const workstream = project.workstreams.find(
      (item) => item._id.toString() === workstreamId && !item.archivedAt,
    );

    if (!workstream) {
      throw new BadRequestException(
        'Workstream does not belong to the project',
      );
    }

    return {
      projectId: project.id,
      projectName: project.name,
      workstreamId: workstream._id.toString(),
      workstreamName: workstream.name,
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async fetchDetails(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<ProjectDetailsResponseDto> {
    const project = await this.requireAccessibleProject(id, workspace);
    const tasks = await this.tasksRepo.findByProject(
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      project.id,
    );

    const raw = project.toObject() as ProjectDocument & {
      _id: Types.ObjectId;
    };
    const memberIds = [
      raw.ownerUserId,
      ...(raw.memberUserIds ?? []),
      ...tasks
        .map((task: TaskDocument) => task.assignee?.id)
        .filter((value): value is Types.ObjectId => Boolean(value)),
    ];
    const users = await this.usersService.findByIds(
      Array.from(new Set(memberIds.map((value) => value.toString()))),
    );

    return this.mapper.toProjectDetailsResponse(project, tasks, users);
  }

  private async requireAccessibleProject(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<ProjectDocument> {
    const project = await this.projectsRepo.findAccessibleById(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private requireProjectWorkstream(
    project: ProjectDocument,
    workstreamId: string,
  ) {
    const workstream = project.workstreams.find(
      (item) => item._id.toString() === workstreamId && !item.archivedAt,
    );

    if (!workstream) {
      throw new BadRequestException(
        'Workstream does not belong to the project',
      );
    }

    return workstream;
  }

  private async resolveAssigneeSnapshot(
    assigneeId?: string,
  ): Promise<TaskAssigneeSnapshot | null> {
    if (!assigneeId) {
      return null;
    }

    const user = await this.usersService.findById(assigneeId);

    return {
      id: new Types.ObjectId(user.id),
      name: user.displayName,
      avatarUrl: undefined,
      role: undefined,
    };
  }

  private assertExactTaskIdSet(
    existingTaskIds: string[],
    candidateTaskIds: string[],
    scopeLabel: string,
  ) {
    if (existingTaskIds.length !== candidateTaskIds.length) {
      throw new BadRequestException(
        `Task reorder payload must include every ${scopeLabel} task exactly once`,
      );
    }

    const existing = new Set(existingTaskIds);
    const candidate = new Set(candidateTaskIds);

    if (existing.size !== candidate.size) {
      throw new BadRequestException('Task reorder payload contains duplicates');
    }

    for (const taskId of existing) {
      if (!candidate.has(taskId)) {
        throw new BadRequestException(
          `Task reorder payload must include every ${scopeLabel} task exactly once`,
        );
      }
    }
  }
}
