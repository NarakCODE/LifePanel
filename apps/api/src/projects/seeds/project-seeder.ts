import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkspacesService } from '../../workspaces/workspaces.service';
import {
  Project,
  ProjectPriority,
  ProjectStatus,
} from '../schemas/project.schema';

interface SeedProjectTemplate {
  name: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  typeLabel: string;
  durationLabel: string;
  workstreams: string[];
}

@Injectable()
export class ProjectSeeder {
  private readonly logger = new Logger(ProjectSeeder.name);

  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
    private readonly workspacesService: WorkspacesService,
  ) {}

  private getMockProjects(): SeedProjectTemplate[] {
    return [
      {
        name: 'Growth Website Refresh',
        status: ProjectStatus.ACTIVE,
        priority: ProjectPriority.HIGH,
        typeLabel: 'Marketing site',
        durationLabel: '6 weeks',
        workstreams: [
          'Positioning and copy',
          'Visual direction',
          'Build and QA',
        ],
      },
      {
        name: 'Client Portal MVP',
        status: ProjectStatus.PLANNED,
        priority: ProjectPriority.URGENT,
        typeLabel: 'MVP',
        durationLabel: '8 weeks',
        workstreams: ['Discovery', 'Core workflows', 'Pilot onboarding'],
      },
      {
        name: 'Support Inbox Automation',
        status: ProjectStatus.ACTIVE,
        priority: ProjectPriority.MEDIUM,
        typeLabel: 'Operations',
        durationLabel: '3 weeks',
        workstreams: ['Workflow mapping', 'Automation rules', 'Team rollout'],
      },
      {
        name: 'Design System Consolidation',
        status: ProjectStatus.BACKLOG,
        priority: ProjectPriority.MEDIUM,
        typeLabel: 'Internal platform',
        durationLabel: 'Quarterly',
        workstreams: ['Audit', 'Token cleanup', 'Component alignment'],
      },
      {
        name: 'Mobile Onboarding Improvements',
        status: ProjectStatus.COMPLETED,
        priority: ProjectPriority.HIGH,
        typeLabel: 'Product optimization',
        durationLabel: '4 weeks',
        workstreams: ['Activation analysis', 'Experiment design', 'Launch'],
      },
      {
        name: 'Legacy Billing Sunset',
        status: ProjectStatus.CANCELLED,
        priority: ProjectPriority.LOW,
        typeLabel: 'Migration',
        durationLabel: 'Deferred',
        workstreams: ['Dependency review', 'Migration planning'],
      },
    ];
  }

  private rotateMembers<T>(items: T[], index: number, count: number): T[] {
    if (!items.length || count <= 0) {
      return [];
    }

    const result: T[] = [];
    for (let offset = 0; offset < Math.min(count, items.length); offset += 1) {
      result.push(items[(index + offset) % items.length]!);
    }
    return result;
  }

  async seedForWorkspace(
    workspaceId: string,
    ownerUserId?: string,
  ): Promise<number> {
    try {
      const workspace = await this.workspacesService.findOne(workspaceId);
      const workspaceMembers = workspace.members;

      if (!workspaceMembers.length) {
        throw new BadRequestException(
          `Workspace ${workspaceId} has no members to seed projects for`,
        );
      }

      const existingCount = await this.projectModel
        .countDocuments({ workspaceId: new Types.ObjectId(workspaceId) })
        .exec();

      if (existingCount > 0) {
        this.logger.log(
          `Workspace ${workspaceId} already has ${existingCount} projects. Skipping seed.`,
        );
        return 0;
      }

      const selectedOwner =
        ownerUserId !== undefined
          ? workspaceMembers.find((member) => member.userId === ownerUserId)
          : workspaceMembers[0];

      if (!selectedOwner) {
        throw new NotFoundException(
          `User ${ownerUserId} is not an active member of workspace ${workspaceId}`,
        );
      }

      const ownerObjectId = new Types.ObjectId(selectedOwner.userId);
      const memberObjectIds = workspaceMembers.map(
        (member) => new Types.ObjectId(member.userId),
      );

      const projectsToInsert = this.getMockProjects().map((template, index) => {
        const ownerForProject =
          memberObjectIds[index % memberObjectIds.length] ?? ownerObjectId;
        const collaborators = this.rotateMembers(memberObjectIds, index + 1, 3)
          .filter(
            (memberId) => memberId.toString() !== ownerForProject.toString(),
          )
          .map((memberId) => new Types.ObjectId(memberId));
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - index * 5);

        return {
          workspaceId: new Types.ObjectId(workspaceId),
          ownerUserId: ownerForProject,
          createdBy: ownerObjectId,
          updatedBy: ownerObjectId,
          name: template.name,
          status: template.status,
          priority: template.priority,
          typeLabel: template.typeLabel,
          durationLabel: template.durationLabel,
          memberUserIds: collaborators,
          workstreams: template.workstreams.map((name, workstreamIndex) => ({
            _id: new Types.ObjectId(),
            name,
            order: workstreamIndex,
            archivedAt: null,
          })),
          createdAt,
          updatedAt: createdAt,
        };
      });

      const result = await this.projectModel.insertMany(projectsToInsert, {
        ordered: false,
      });

      this.logger.log(
        `Successfully seeded ${result.length} projects for workspace ${workspaceId}`,
      );

      return result.length;
    } catch (error) {
      this.logger.error(
        `Failed to seed projects for workspace ${workspaceId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async clearAll(): Promise<number> {
    const result = await this.projectModel.deleteMany({}).exec();
    this.logger.log(`Cleared ${result.deletedCount} projects`);
    return result.deletedCount;
  }

  async clearForWorkspace(workspaceId: string): Promise<number> {
    const result = await this.projectModel
      .deleteMany({ workspaceId: new Types.ObjectId(workspaceId) })
      .exec();
    this.logger.log(
      `Cleared ${result.deletedCount} projects for workspace ${workspaceId}`,
    );
    return result.deletedCount;
  }
}
