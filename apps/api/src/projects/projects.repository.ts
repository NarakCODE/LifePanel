import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  buildWorkspaceScopedFilter,
  toObjectId,
  toObjectIdOrNull,
  WorkspaceScope,
} from '../common/utils/workspace-scope.util';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project, ProjectDocument } from './schemas/project.schema';

@Injectable()
export class ProjectsRepository {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async create(
    scope: WorkspaceScope,
    dto: CreateProjectDto,
  ): Promise<ProjectDocument> {
    const project = new this.projectModel({
      workspaceId: toObjectId(scope.workspaceId),
      ownerUserId: toObjectId(scope.userId),
      createdBy: toObjectId(scope.userId),
      updatedBy: toObjectId(scope.userId),
      name: dto.name,
      status: dto.status,
      priority: dto.priority,
      typeLabel: dto.typeLabel,
      durationLabel: dto.durationLabel,
      memberUserIds: (dto.memberUserIds ?? []).map((id) => toObjectId(id)),
      workstreams: (dto.workstreams ?? []).map((workstream, index) => ({
        name: workstream.name,
        order: workstream.order ?? index,
      })),
    });

    return project.save();
  }

  async findAllAccessible(scope: WorkspaceScope): Promise<ProjectDocument[]> {
    return this.projectModel
      .find(
        buildWorkspaceScopedFilter(scope, {
          $or: [
            { ownerUserId: toObjectId(scope.userId) },
            { memberUserIds: toObjectId(scope.userId) },
          ],
        }),
      )
      .sort({ updatedAt: -1, createdAt: -1 })
      .exec();
  }

  async findAccessibleById(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<ProjectDocument | null> {
    const projectId = toObjectIdOrNull(id);
    if (!projectId) {
      return null;
    }

    return this.projectModel
      .findOne({
        _id: projectId,
        ...buildWorkspaceScopedFilter(scope, {
          $or: [
            { ownerUserId: toObjectId(scope.userId) },
            { memberUserIds: toObjectId(scope.userId) },
          ],
        }),
      })
      .exec();
  }

  async updateByIdAndWorkspace(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
    update: Partial<Project>,
  ): Promise<ProjectDocument | null> {
    const projectId = toObjectIdOrNull(id);
    if (!projectId) {
      return null;
    }

    return this.projectModel
      .findOneAndUpdate(
        {
          _id: projectId,
          ...buildWorkspaceScopedFilter(scope, {
            ownerUserId: toObjectId(scope.userId),
          }),
        },
        {
          $set: {
            ...update,
            updatedBy: toObjectId(scope.userId),
          },
        },
        { new: true },
      )
      .exec();
  }

  async deleteByIdAndWorkspace(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<boolean> {
    const projectId = toObjectIdOrNull(id);
    if (!projectId) {
      return false;
    }

    const result = await this.projectModel
      .deleteOne({
        _id: projectId,
        ...buildWorkspaceScopedFilter(scope, {
          ownerUserId: toObjectId(scope.userId),
        }),
      })
      .exec();

    return result.deletedCount > 0;
  }

  async getProjectOverview(scope: WorkspaceScope): Promise<{
    total: number;
    countsByStatus: {
      backlog: number;
      planned: number;
      active: number;
      completed: number;
      cancelled: number;
    };
  }> {
    const result = await this.projectModel
      .aggregate([
        {
          $match: buildWorkspaceScopedFilter(scope, {
            $or: [
              { ownerUserId: toObjectId(scope.userId) },
              { memberUserIds: toObjectId(scope.userId) },
            ],
          }),
        },
        {
          $facet: {
            statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
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
        backlog: 0,
        planned: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
      },
    };

    for (const statusCount of data.statusCounts ?? []) {
      const key = statusCount._id as string;
      if (key in overview.countsByStatus) {
        overview.countsByStatus[key as keyof typeof overview.countsByStatus] =
          statusCount.count;
      }
    }

    return overview;
  }
}
