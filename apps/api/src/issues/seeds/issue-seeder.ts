import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { WorkspacesService } from '../../workspaces/workspaces.service';
import { ProjectsService } from '../../projects/projects.service';
import { WorkspaceRequestContext } from '../../workspaces/interfaces/workspace-context.interface';
import { IssuesRepository } from '../issues.repository';
import { IssuePriority, IssueStatus, IssueType } from '../schemas/issue.schema';

interface SeedIssueTemplate {
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
  labels: string[];
  dueInDays?: number;
}

@Injectable()
export class IssueSeeder {
  private readonly logger = new Logger(IssueSeeder.name);

  constructor(
    private readonly issuesRepository: IssuesRepository,
    private readonly workspacesService: WorkspacesService,
    private readonly projectsService: ProjectsService,
  ) {}

  private getTemplates(): SeedIssueTemplate[] {
    return [
      {
        title: 'Build issue list API filters',
        description: 'Support status, priority, assignee, and label filters.',
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        type: IssueType.TASK,
        labels: ['backend', 'api'],
        dueInDays: 3,
      },
      {
        title: 'Fix duplicate issue identifier race',
        description: 'Protect issue identifiers under concurrent creation.',
        status: IssueStatus.BACKLOG,
        priority: IssuePriority.URGENT,
        type: IssueType.BUG,
        labels: ['backend', 'bug'],
      },
      {
        title: 'Improve project board loading copy',
        description: 'Refine empty-state and loading-state copy for clarity.',
        status: IssueStatus.TODO,
        priority: IssuePriority.MEDIUM,
        type: IssueType.IMPROVEMENT,
        labels: ['ux'],
        dueInDays: 7,
      },
      {
        title: 'Question: should cycles auto-close overdue issues?',
        description:
          'Validate expected rollover behavior before implementing cycles.',
        status: IssueStatus.IN_REVIEW,
        priority: IssuePriority.LOW,
        type: IssueType.QUESTION,
        labels: ['planning'],
      },
      {
        title: 'Blocker: missing permission mapping for issue routes',
        description:
          'Issue CRUD cannot ship without workspace permission coverage.',
        status: IssueStatus.DONE,
        priority: IssuePriority.URGENT,
        type: IssueType.BLOCKER,
        labels: ['security', 'backend'],
      },
    ];
  }

  async seedForWorkspace(
    workspaceId: string,
    reporterUserId?: string,
  ): Promise<number> {
    const workspace = await this.workspacesService.findOne(workspaceId);
    const workspaceMembers = workspace.members;

    if (!workspaceMembers.length) {
      throw new BadRequestException(
        `Workspace ${workspaceId} has no members to seed issues for`,
      );
    }

    const reporter =
      reporterUserId !== undefined
        ? workspaceMembers.find((member) => member.userId === reporterUserId)
        : workspaceMembers[0];

    if (!reporter) {
      throw new NotFoundException(
        `User ${reporterUserId} is not an active member of workspace ${workspaceId}`,
      );
    }

    const reporterId = new Types.ObjectId(reporter.userId);
    const assigneeIds = workspaceMembers.map(
      (member) => new Types.ObjectId(member.userId),
    );
    const projects = await this.projectsService.findAllAccessible({
      workspaceId,
      actorUserId: reporter.userId,
      role: reporter.role,
      permissions: [],
    } as unknown as WorkspaceRequestContext);

    const templates = this.getTemplates();
    let createdCount = 0;

    for (const [index, template] of templates.entries()) {
      const identifier =
        await this.issuesRepository.getNextIdentifier(workspaceId);
      const dueDate =
        template.dueInDays !== undefined
          ? new Date(Date.now() + template.dueInDays * 24 * 60 * 60 * 1000)
          : null;
      const project = projects[index % projects.length];
      const assigneeId = assigneeIds[index % assigneeIds.length] ?? null;

      await this.issuesRepository.create(
        {
          workspaceId,
          userId: reporter.userId,
        },
        {
          identifier,
          title: template.title,
          description: template.description,
          status: template.status,
          priority: template.priority,
          type: template.type,
          projectId: project ? new Types.ObjectId(project.id) : null,
          cycleId: null,
          assigneeId,
          reporterId,
          labels: template.labels,
          dueDate,
          completedAt: template.status === IssueStatus.DONE ? new Date() : null,
          archivedAt: null,
        },
      );

      createdCount += 1;
    }

    this.logger.log(
      `Successfully seeded ${createdCount} issues for workspace ${workspaceId}`,
    );

    return createdCount;
  }

  async clearAll(): Promise<number> {
    const deleted = await this.issuesRepository.deleteMany({});
    this.logger.log(`Cleared ${deleted} issues`);
    return deleted;
  }

  async clearForWorkspace(workspaceId: string): Promise<number> {
    const deleted = await this.issuesRepository.deleteMany({
      workspaceId: new Types.ObjectId(workspaceId),
    });
    this.logger.log(`Cleared ${deleted} issues for workspace ${workspaceId}`);
    return deleted;
  }
}
