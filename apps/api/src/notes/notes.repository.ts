import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types, UpdateQuery } from 'mongoose';
import {
  buildWorkspaceScopedFilter,
  toObjectId,
  toObjectIdOrNull,
  WorkspaceScope,
} from '../common/utils/workspace-scope.util';
import { QueryNoteDto } from './dto/query-note.dto';
import {
  Note,
  NoteAuthorSnapshot,
  NoteDocument,
  NoteType,
  NoteStatus,
} from './schemas/note.schema';

export type NotePersistenceInput = {
  title: string;
  projectId: string;
  projectName?: string;
  content?: string;
  noteType?: NoteType;
  status?: NoteStatus;
  audioUrl?: string;
  audioDuration?: string;
  author?: NoteAuthorSnapshot | null;
};

export type NoteListResult = {
  items: NoteDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type NoteQueryFilter = Record<string, any>;

/**
 * Encapsulates all Mongoose queries for Notes (arch-use-repository-pattern).
 */
@Injectable()
export class NotesRepository {
  constructor(
    @InjectModel(Note.name) private readonly noteModel: Model<NoteDocument>,
  ) {}

  async create(
    scope: WorkspaceScope,
    input: NotePersistenceInput,
  ): Promise<NoteDocument> {
    const createdNote = new this.noteModel({
      ...input,
      workspaceId: toObjectId(scope.workspaceId),
      userId: toObjectId(scope.userId),
      createdBy: toObjectId(scope.userId),
      updatedBy: toObjectId(scope.userId),
    });

    return createdNote.save();
  }

  async findById(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<NoteDocument | null> {
    const noteId = toObjectIdOrNull(id);
    if (!noteId) {
      return null;
    }

    return this.noteModel
      .findOne({
        _id: noteId,
        ...buildWorkspaceScopedFilter(scope, {
          userId: toObjectId(scope.userId),
        }),
      })
      .exec();
  }

  async findWithPagination(
    scope: WorkspaceScope,
    query: QueryNoteDto,
  ): Promise<NoteListResult> {
    const filter = this.buildFilter(scope, query);
    const sort = this.buildSort(query);
    const limit = query.limit ?? 20;
    const page = query.page ?? 1;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.noteModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.noteModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByProject(
    scope: WorkspaceScope,
    projectId: string,
    query?: Omit<QueryNoteDto, 'projectId'>,
  ): Promise<NoteListResult> {
    const filter = this.buildFilter(scope, { ...query, projectId });
    const sort = this.buildSort(query ?? {});
    const limit = query?.limit ?? 100;
    const page = query?.page ?? 1;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.noteModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.noteModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateById(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
    updateData: UpdateQuery<NoteDocument>,
  ): Promise<NoteDocument | null> {
    const noteId = toObjectIdOrNull(id);
    if (!noteId) {
      return null;
    }

    const nextSet = { ...(updateData.$set ?? {}) } as Record<string, unknown>;
    nextSet.updatedBy = toObjectId(scope.userId);

    return this.noteModel
      .findOneAndUpdate(
        {
          _id: noteId,
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

  async deleteById(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<boolean> {
    const noteId = toObjectIdOrNull(id);
    if (!noteId) {
      return false;
    }

    const result = await this.noteModel
      .deleteOne({
        _id: noteId,
        ...buildWorkspaceScopedFilter(scope, {
          userId: toObjectId(scope.userId),
        }),
      })
      .exec();

    return result.deletedCount > 0;
  }

  private buildFilter(
    scope: WorkspaceScope,
    query: QueryNoteDto,
  ): NoteQueryFilter {
    const filter: NoteQueryFilter = buildWorkspaceScopedFilter(scope, {
      userId: toObjectId(scope.userId),
    });

    if (query.projectId) {
      filter.projectId = query.projectId;
    }

    if (query.noteType) {
      filter.noteType = query.noteType;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { content: { $regex: query.search, $options: 'i' } },
      ];
    }

    return filter;
  }

  async getNoteOverview(scope: WorkspaceScope): Promise<{
    total: number;
    countsByStatus: {
      completed: number;
      processing: number;
    };
  }> {
    const result = await this.noteModel
      .aggregate([
        {
          $match: buildWorkspaceScopedFilter(scope, {
            userId: toObjectId(scope.userId),
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
        completed: 0,
        processing: 0,
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

  private buildSort(query: QueryNoteDto): Record<string, SortOrder> {
    const sortFieldMap: Record<string, string> = {
      title: 'title',
      noteType: 'noteType',
      status: 'status',
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
}
