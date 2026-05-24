import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { IssueListResultDto, IssueResponseDto } from './dto/issue-response.dto';
import { QueryIssueDto } from './dto/query-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { IssuesRepository } from './issues.repository';
import {
  IssueDocument,
  IssuePriority,
  IssueStatus,
  IssueType,
} from './schemas/issue.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IssueAssignedEvent,
  IssueUpdatedEvent,
} from '../notifications/listeners/issue-notifications.listener';

@Injectable()
export class IssuesService {
  constructor(
    private readonly issuesRepository: IssuesRepository,
    private readonly usersService: UsersService,
    private readonly projectsService: ProjectsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    workspace: WorkspaceRequestContext,
    dto: CreateIssueDto,
  ): Promise<IssueResponseDto> {
    await this.assertProjectAccessible(workspace, dto.projectId);
    await this.assertAssigneeAccessible(dto.assigneeId);

    const identifier = await this.issuesRepository.getNextIdentifier(
      workspace.workspaceId,
    );
    const reporter = await this.usersService.findById(workspace.actorUserId);
    const status = dto.status ?? IssueStatus.BACKLOG;

    const issue = await this.issuesRepository.create(
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      {
        identifier,
        title: dto.title,
        description: dto.description ?? null,
        status,
        priority: dto.priority ?? IssuePriority.NONE,
        type: dto.type ?? IssueType.TASK,
        projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : null,
        cycleId: dto.cycleId ? new Types.ObjectId(dto.cycleId) : null,
        assigneeId: dto.assigneeId ? new Types.ObjectId(dto.assigneeId) : null,
        reporterId: new Types.ObjectId(reporter.id),
        labels: this.normalizeLabels(dto.labels),
        dueDate: dto.dueDate ?? null,
        completedAt: status === IssueStatus.DONE ? new Date() : null,
        archivedAt: null,
      },
    );

    if (issue.assigneeId) {
      this.eventEmitter.emit('issue.assigned', {
        issueId: issue._id.toString(),
        issueIdentifier: issue.identifier,
        issueTitle: issue.title,
        assignerId: workspace.actorUserId,
        assignerName: reporter.displayName,
        assigneeId: issue.assigneeId.toString(),
        workspaceId: workspace.workspaceId,
      } as IssueAssignedEvent);
    }

    return this.toIssueResponse(issue);
  }

  async findMany(
    workspace: WorkspaceRequestContext,
    query: QueryIssueDto,
  ): Promise<IssueListResultDto> {
    const result = await this.issuesRepository.findWithPagination(
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      query,
    );

    return this.toIssueListResult(result.items, result.total, query);
  }

  async getMyIssues(
    workspace: WorkspaceRequestContext,
    query: QueryIssueDto,
  ): Promise<IssueListResultDto> {
    const result = await this.issuesRepository.findWithPagination(
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      query,
      {
        assigneeId: new Types.ObjectId(workspace.actorUserId),
      },
    );

    return this.toIssueListResult(result.items, result.total, query);
  }

  async findById(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<IssueResponseDto> {
    const issue = await this.issuesRepository.findByIdInWorkspace(
      id,
      workspace.workspaceId,
    );

    if (!issue || issue.archivedAt) {
      throw new NotFoundException('Issue not found');
    }

    return this.toIssueResponse(issue);
  }

  async update(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateIssueDto,
  ): Promise<IssueResponseDto> {
    const existing = await this.issuesRepository.findByIdInWorkspace(
      id,
      workspace.workspaceId,
    );

    if (!existing || existing.archivedAt) {
      throw new NotFoundException('Issue not found');
    }

    if (dto.projectId !== undefined && dto.projectId !== null) {
      await this.assertProjectAccessible(workspace, dto.projectId);
    }
    if (dto.assigneeId !== undefined && dto.assigneeId !== null) {
      await this.assertAssigneeAccessible(dto.assigneeId);
    }

    const nextStatus = dto.status ?? existing.status;
    const updateSet: Record<string, unknown> = {};

    if (dto.title !== undefined) {
      updateSet.title = dto.title;
    }
    if (dto.description !== undefined) {
      updateSet.description = dto.description ?? null;
    }
    if (dto.status !== undefined) {
      updateSet.status = dto.status;
      updateSet.completedAt =
        dto.status === IssueStatus.DONE
          ? (dto.completedAt ?? existing.completedAt ?? new Date())
          : null;
    } else if (dto.completedAt !== undefined) {
      updateSet.completedAt = dto.completedAt;
    }
    if (dto.priority !== undefined) {
      updateSet.priority = dto.priority;
    }
    if (dto.type !== undefined) {
      updateSet.type = dto.type;
    }
    if (dto.projectId !== undefined) {
      updateSet.projectId = dto.projectId
        ? new Types.ObjectId(dto.projectId)
        : null;
    }
    if (dto.cycleId !== undefined) {
      updateSet.cycleId = dto.cycleId ? new Types.ObjectId(dto.cycleId) : null;
    }
    if (dto.assigneeId !== undefined) {
      updateSet.assigneeId = dto.assigneeId
        ? new Types.ObjectId(dto.assigneeId)
        : null;
    }
    if (dto.labels !== undefined) {
      updateSet.labels = this.normalizeLabels(dto.labels);
    }
    if (dto.dueDate !== undefined) {
      updateSet.dueDate = dto.dueDate ?? null;
    }
    if (dto.archivedAt !== undefined) {
      updateSet.archivedAt = dto.archivedAt;
    } else if (nextStatus === IssueStatus.CANCELED) {
      updateSet.archivedAt = existing.archivedAt ?? null;
    }

    const updated = await this.issuesRepository.updateByIdInWorkspace(
      id,
      workspace.workspaceId,
      {
        $set: updateSet,
      },
    );

    if (!updated) {
      throw new NotFoundException('Issue not found');
    }

    const changedFields = Object.keys(updateSet);
    const isAssigneeChanged =
      dto.assigneeId !== undefined &&
      dto.assigneeId !== null &&
      (!existing.assigneeId ||
        existing.assigneeId.toString() !== dto.assigneeId);

    const actor = await this.usersService.findById(workspace.actorUserId);

    if (isAssigneeChanged) {
      this.eventEmitter.emit('issue.assigned', {
        issueId: updated._id.toString(),
        issueIdentifier: updated.identifier,
        issueTitle: updated.title,
        assignerId: workspace.actorUserId,
        assignerName: actor.displayName,
        assigneeId: updated.assigneeId!.toString(),
        workspaceId: workspace.workspaceId,
      } as IssueAssignedEvent);
    } else if (changedFields.length > 0 && updated.assigneeId) {
      this.eventEmitter.emit('issue.updated', {
        issueId: updated._id.toString(),
        issueIdentifier: updated.identifier,
        issueTitle: updated.title,
        updaterId: workspace.actorUserId,
        updaterName: actor.displayName,
        assigneeId: updated.assigneeId.toString(),
        workspaceId: workspace.workspaceId,
        changes: changedFields,
      } as IssueUpdatedEvent);
    }

    return this.toIssueResponse(updated);
  }

  async delete(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<{ message: string }> {
    const deleted = await this.issuesRepository.deleteByIdInWorkspace(
      id,
      workspace.workspaceId,
    );

    if (!deleted) {
      throw new NotFoundException('Issue not found');
    }

    return { message: 'Issue deleted successfully' };
  }

  private async assertProjectAccessible(
    workspace: WorkspaceRequestContext,
    projectId?: string,
  ): Promise<void> {
    if (!projectId) {
      return;
    }

    await this.projectsService.findByIdAccessible(projectId, workspace);
  }

  private async assertAssigneeAccessible(assigneeId?: string): Promise<void> {
    if (!assigneeId) {
      return;
    }

    await this.usersService.findById(assigneeId);
  }

  private normalizeLabels(labels?: string[]): string[] {
    if (!labels?.length) {
      return [];
    }

    return Array.from(
      new Set(
        labels
          .map((label) => label.trim())
          .filter(Boolean)
          .map((label) => label.toLowerCase()),
      ),
    );
  }

  private toIssueResponse(issue: IssueDocument): IssueResponseDto {
    const raw = issue.toObject() as IssueDocument & {
      _id: Types.ObjectId;
      workspaceId: Types.ObjectId;
      projectId?: Types.ObjectId | null;
      cycleId?: Types.ObjectId | null;
      assigneeId?: Types.ObjectId | null;
      reporterId: Types.ObjectId;
      createdAt: Date;
      updatedAt: Date;
    };

    return new IssueResponseDto({
      id: raw._id.toString(),
      workspaceId: raw.workspaceId.toString(),
      identifier: raw.identifier,
      title: raw.title,
      description: raw.description ?? null,
      status: raw.status,
      priority: raw.priority,
      type: raw.type,
      projectId: raw.projectId?.toString() ?? null,
      cycleId: raw.cycleId?.toString() ?? null,
      assigneeId: raw.assigneeId?.toString() ?? null,
      reporterId: raw.reporterId.toString(),
      labels: raw.labels ?? [],
      dueDate: raw.dueDate ?? null,
      completedAt: raw.completedAt ?? null,
      archivedAt: raw.archivedAt ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async getIssueOverview(workspace: WorkspaceRequestContext) {
    return this.issuesRepository.getIssueOverview({
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
  }

  private toIssueListResult(
    items: IssueDocument[],
    total: number,
    query: QueryIssueDto,
  ): IssueListResultDto {
    return {
      data: {
        issues: items.map((item) => this.toIssueResponse(item)),
        pagination: {
          total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(total / query.limit),
        },
      },
    };
  }
}
