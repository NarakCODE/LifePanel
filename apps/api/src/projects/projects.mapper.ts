/**
 * ProjectsMapper — pure, stateless DTO-mapping helpers.
 *
 * (arch-single-responsibility) Extracted from ProjectsService so the service
 * can focus on business logic while mapping lives in one cohesive place.
 */
import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  ProjectDocument,
  ProjectPriority,
  ProjectStatus,
} from './schemas/project.schema';
import {
  ProjectResponseDto,
  ProjectWorkstreamResponseDto,
} from './dto/project-response.dto';
import {
  ProjectDetailsBacklogSummaryDto,
  ProjectDetailsKeyFeaturesDto,
  ProjectDetailsMetaDto,
  ProjectDetailsProjectTaskDto,
  ProjectDetailsResponseDto,
  ProjectDetailsScopeDto,
  ProjectDetailsTimeSummaryDto,
  ProjectDetailsTimelineTaskDto,
  ProjectDetailsUserDto,
  ProjectDetailsWorkstreamDto,
  ProjectDetailsWorkstreamTaskDto,
} from './dto/project-details-response.dto';
import {
  TaskAssigneeResponseDto,
  TaskResponseDto,
} from '../tasks/dto/task-response.dto';
import {
  TaskAssigneeSnapshot,
  TaskDocument,
  TaskPriority,
  TaskStatus,
} from '../tasks/schemas/task.schema';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class ProjectsMapper {
  // ── Public mapping methods ───────────────────────────────────────────────

  toProjectResponse(project: ProjectDocument): ProjectResponseDto {
    const raw = project.toObject() as ProjectDocument & {
      _id: Types.ObjectId;
    };

    return new ProjectResponseDto({
      id: raw._id.toString(),
      workspaceId: raw.workspaceId.toString(),
      name: raw.name,
      status: (raw.status as ProjectStatus) ?? ProjectStatus.ACTIVE,
      priority: (raw.priority as ProjectPriority) ?? ProjectPriority.MEDIUM,
      typeLabel: raw.typeLabel,
      durationLabel: raw.durationLabel,
      workstreams: (raw.workstreams ?? [])
        .filter((workstream) => !workstream.archivedAt)
        .sort((left, right) => left.order - right.order)
        .map(
          (workstream) =>
            new ProjectWorkstreamResponseDto({
              id: workstream._id.toString(),
              name: workstream.name,
              order: workstream.order,
            }),
        ),
    });
  }

  toProjectDetailsResponse(
    project: ProjectDocument,
    tasks: TaskDocument[],
    users: UserDocument[],
  ): ProjectDetailsResponseDto {
    const raw = project.toObject() as ProjectDocument & {
      _id: Types.ObjectId;
    };
    const activeWorkstreams = (raw.workstreams ?? [])
      .filter((workstream) => !workstream.archivedAt)
      .sort((left, right) => left.order - right.order);
    const visibleTasks = tasks.filter(
      (task) => this.normalizeStatus(task.status) !== TaskStatus.ARCHIVED,
    );
    const workstreamNameById = new Map(
      activeWorkstreams.map((workstream) => [
        workstream._id.toString(),
        workstream.name,
      ]),
    );
    const userMap = new Map(
      users.map((user) => [this.stringifyObjectId(user._id), user]),
    );
    const owner = userMap.get(this.stringifyObjectId(raw.ownerUserId));
    const supportUsers = (raw.memberUserIds ?? [])
      .map((memberId) => userMap.get(this.stringifyObjectId(memberId)))
      .filter((user): user is UserDocument => Boolean(user));
    const sortedProjectTasks = this.sortByProjectOrder(visibleTasks);
    const workstreams = activeWorkstreams.map(
      (workstream) =>
        new ProjectDetailsWorkstreamDto({
          id: workstream._id.toString(),
          name: workstream.name,
          order: workstream.order,
          tasks: this.sortByWorkstreamOrder(
            visibleTasks.filter(
              (task) => task.workstreamId === workstream._id.toString(),
            ),
          ).map((task) => this.toWorkstreamTaskDto(task)),
        }),
    );
    const projectTasks = sortedProjectTasks.map((task) =>
      this.toProjectTaskDto(
        task,
        raw.name,
        workstreamNameById.get(task.workstreamId ?? '') ?? task.workstreamName,
      ),
    );
    const scheduledTasks = sortedProjectTasks.filter(
      (task) => task.startDate || task.dueDate,
    );
    const dueDate = this.resolveProjectDueDate(raw, visibleTasks);
    const progressPercent = this.calculateProgressPercent(visibleTasks);

    return new ProjectDetailsResponseDto({
      id: raw._id.toString(),
      workspaceId: raw.workspaceId.toString(),
      name: raw.name,
      status: (raw.status as ProjectStatus) ?? ProjectStatus.ACTIVE,
      priority: (raw.priority as ProjectPriority) ?? ProjectPriority.MEDIUM,
      typeLabel: raw.typeLabel,
      durationLabel: raw.durationLabel,
      description: `Project delivery hub for ${raw.name}. Add richer scope, notes, and assets as those modules come online.`,
      meta: new ProjectDetailsMetaDto({
        priorityLabel: this.capitalize(raw.priority ?? ProjectPriority.MEDIUM),
        locationLabel: 'Workspace',
        sprintLabel:
          raw.typeLabel && raw.durationLabel
            ? `${raw.typeLabel} ${raw.durationLabel}`
            : (raw.durationLabel ?? raw.typeLabel ?? 'Rolling delivery'),
        lastSyncLabel: this.formatDateLabel(raw.updatedAt ?? raw.createdAt),
      }),
      scope: new ProjectDetailsScopeDto({
        inScope:
          activeWorkstreams.length > 0
            ? activeWorkstreams.map((workstream) => workstream.name)
            : ['Track project execution'],
        outOfScope: [
          'Notes and file storage are pending dedicated backend modules',
        ],
      }),
      outcomes:
        visibleTasks.length > 0
          ? [
              `Track ${visibleTasks.length} tasks in one project view`,
              'Keep workstream execution visible',
              'Reduce context switching across project tabs',
            ]
          : ['Track project execution in one place'],
      keyFeatures: new ProjectDetailsKeyFeaturesDto({
        p0:
          activeWorkstreams.length > 0
            ? activeWorkstreams.slice(0, 2).map((workstream) => workstream.name)
            : ['Project task tracking'],
        p1: ['Timeline scheduling'],
        p2: ['Notes and file attachments'],
      }),
      timelineTasks: scheduledTasks.map(
        (task) =>
          new ProjectDetailsTimelineTaskDto({
            id: task.id,
            name: task.name,
            startDate: task.startDate ?? task.dueDate ?? dueDate,
            endDate: task.dueDate ?? task.startDate ?? dueDate,
            status: this.toTimelineStatus(task.status),
          }),
      ),
      workstreams,
      projectTasks,
      time: new ProjectDetailsTimeSummaryDto({
        estimateLabel:
          raw.durationLabel ??
          `${visibleTasks.length} task${visibleTasks.length === 1 ? '' : 's'}`,
        dueDate,
        daysRemainingLabel: this.formatDaysRemainingLabel(dueDate),
        progressPercent,
      }),
      backlog: new ProjectDetailsBacklogSummaryDto({
        statusLabel: this.toBacklogStatusLabel(raw.status),
        groupLabel: activeWorkstreams[0]?.name ?? 'General',
        priorityLabel: this.capitalize(raw.priority ?? ProjectPriority.MEDIUM),
        labelBadge: raw.typeLabel ?? 'Project',
        picUsers: owner
          ? [this.toUserDto(owner)]
          : [
              new ProjectDetailsUserDto({
                id: this.stringifyObjectId(raw.ownerUserId),
                name: 'Project owner',
              }),
            ],
        supportUsers: supportUsers
          .slice(0, 5)
          .map((user) => this.toUserDto(user)),
      }),
      quickLinks: [],
      files: [],
      notes: [],
    });
  }

  toTaskResponse(task: TaskDocument): TaskResponseDto {
    return new TaskResponseDto({
      id: task.id,
      workspaceId: task.workspaceId
        ? this.stringifyObjectId(task.workspaceId)
        : '',
      name: task.name,
      status: this.normalizeStatus(task.status),
      projectId: task.projectId,
      projectName: task.projectName,
      workstreamId: task.workstreamId,
      workstreamName: task.workstreamName,
      assignee: task.assignee
        ? new TaskAssigneeResponseDto({
            id: this.stringifyObjectId(task.assignee.id),
            name: task.assignee.name,
            avatarUrl: task.assignee.avatarUrl,
            role: task.assignee.role,
          })
        : undefined,
      startDate: task.startDate,
      priority: this.normalizePriority(task.priority),
      tag: task.tag,
      description: task.description,
      dueDate: task.dueDate,
      completedAt: task.completedAt ?? null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
  }

  // ── Sorting helpers (used by service logic as well) ───────────────────────

  sortByProjectOrder(tasks: TaskDocument[]): TaskDocument[] {
    return [...tasks].sort((left, right) => {
      const leftOrder = left.projectOrder ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.projectOrder ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.createdAt.getTime() - right.createdAt.getTime();
    });
  }

  sortByWorkstreamOrder(tasks: TaskDocument[]): TaskDocument[] {
    return [...tasks].sort((left, right) => {
      const leftOrder = left.workstreamOrder ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.workstreamOrder ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.createdAt.getTime() - right.createdAt.getTime();
    });
  }

  // ── Status / priority normalisation (used by service too) ────────────────

  normalizeStatus(status?: TaskStatus | string): TaskStatus {
    if (status === 'in_progress') {
      return TaskStatus.IN_PROGRESS;
    }

    if (status === TaskStatus.ARCHIVED) {
      return TaskStatus.ARCHIVED;
    }

    return (status as TaskStatus) ?? TaskStatus.TODO;
  }

  normalizePriority(priority?: TaskPriority | number | string): TaskPriority {
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

  stringifyObjectId(value?: Types.ObjectId | string | null): string {
    if (!value) {
      return '';
    }

    return value instanceof Types.ObjectId ? value.toString() : value;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private toWorkstreamTaskDto(
    task: TaskDocument,
  ): ProjectDetailsWorkstreamTaskDto {
    const duePresentation = this.getDuePresentation(task.dueDate);

    return new ProjectDetailsWorkstreamTaskDto({
      id: task.id,
      name: task.name,
      status: this.normalizeStatus(task.status),
      dueLabel: duePresentation?.label,
      dueTone: duePresentation?.tone,
      assignee: this.toAssigneeDto(task.assignee),
      startDate: task.startDate,
      dueDate: task.dueDate,
      priority: this.normalizePriority(task.priority),
      tag: task.tag,
      description: task.description,
      order: task.workstreamOrder,
    });
  }

  private toProjectTaskDto(
    task: TaskDocument,
    projectName: string,
    workstreamName?: string,
  ): ProjectDetailsProjectTaskDto {
    const duePresentation = this.getDuePresentation(task.dueDate);

    return new ProjectDetailsProjectTaskDto({
      id: task.id,
      name: task.name,
      status: this.normalizeStatus(task.status),
      dueLabel: duePresentation?.label,
      dueTone: duePresentation?.tone,
      assignee: this.toAssigneeDto(task.assignee),
      startDate: task.startDate,
      dueDate: task.dueDate,
      priority: this.normalizePriority(task.priority),
      tag: task.tag,
      description: task.description,
      projectId: task.projectId,
      projectName,
      workstreamId: task.workstreamId ?? '',
      workstreamName: workstreamName ?? task.workstreamName ?? 'General',
      order: task.projectOrder,
    });
  }

  private toUserDto(user: UserDocument): ProjectDetailsUserDto {
    return new ProjectDetailsUserDto({
      id: this.stringifyObjectId(user._id),
      name: user.displayName,
    });
  }

  private toAssigneeDto(
    assignee?: TaskAssigneeSnapshot | null,
  ): ProjectDetailsUserDto | undefined {
    if (!assignee) {
      return undefined;
    }

    return new ProjectDetailsUserDto({
      id: this.stringifyObjectId(assignee.id),
      name: assignee.name,
      avatarUrl: assignee.avatarUrl,
      role: assignee.role,
    });
  }

  private resolveProjectDueDate(
    project: ProjectDocument & { _id?: Types.ObjectId },
    tasks: TaskDocument[],
  ): Date {
    const scheduledDates = tasks
      .flatMap((task) => [task.dueDate, task.startDate])
      .filter((value): value is Date => value instanceof Date);

    if (scheduledDates.length === 0) {
      return project.updatedAt ?? project.createdAt ?? new Date();
    }

    return scheduledDates.reduce((latest, current) =>
      current.getTime() > latest.getTime() ? current : latest,
    );
  }

  private calculateProgressPercent(tasks: TaskDocument[]): number {
    const activeTasks = tasks.filter(
      (task) => task.status !== TaskStatus.ARCHIVED,
    );

    if (activeTasks.length === 0) {
      return 0;
    }

    const completedTasks = activeTasks.filter(
      (task) => this.normalizeStatus(task.status) === TaskStatus.DONE,
    ).length;

    return Math.round((completedTasks / activeTasks.length) * 100);
  }

  private getDuePresentation(dueDate?: Date): {
    label: string;
    tone: 'danger' | 'warning' | 'muted';
  } | null {
    if (!dueDate) {
      return null;
    }

    const now = new Date();
    const diffDays = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) {
      return {
        label: `Overdue ${Math.abs(diffDays)}d`,
        tone: 'danger',
      };
    }

    if (diffDays === 0) {
      return {
        label: 'Today',
        tone: 'warning',
      };
    }

    if (diffDays === 1) {
      return {
        label: 'Tomorrow',
        tone: 'warning',
      };
    }

    return {
      label: this.formatDateLabel(dueDate),
      tone: 'muted',
    };
  }

  private formatDateLabel(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  private formatDaysRemainingLabel(date: Date): string {
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) {
      return `${Math.abs(diffDays)}d overdue`;
    }

    if (diffDays === 0) {
      return 'Today';
    }

    return `${diffDays}d left`;
  }

  private toBacklogStatusLabel(
    status: ProjectStatus | string | undefined,
  ): 'Active' | 'Backlog' | 'Planned' | 'Completed' | 'Cancelled' {
    switch (status) {
      case ProjectStatus.BACKLOG:
        return 'Backlog';
      case ProjectStatus.PLANNED:
        return 'Planned';
      case ProjectStatus.COMPLETED:
        return 'Completed';
      case ProjectStatus.CANCELLED:
        return 'Cancelled';
      default:
        return 'Active';
    }
  }

  private toTimelineStatus(
    status?: TaskStatus | string,
  ): 'planned' | 'in-progress' | 'done' {
    const normalized = this.normalizeStatus(status);

    if (normalized === TaskStatus.DONE) {
      return 'done';
    }

    if (normalized === TaskStatus.IN_PROGRESS) {
      return 'in-progress';
    }

    return 'planned';
  }

  private capitalize(value: string): string {
    if (!value) {
      return value;
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
