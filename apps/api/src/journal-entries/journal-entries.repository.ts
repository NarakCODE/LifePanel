import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  buildWorkspaceScopedFilter,
  toObjectId,
  WorkspaceScope,
} from '../common/utils/workspace-scope.util';
import {
  JournalEntry,
  JournalEntryDocument,
  MoodLevel,
} from './schemas/journal-entry.schema';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { QueryJournalEntryDto } from './dto/query-journal-entry.dto';
import { MoodSummaryQueryDto } from './dto/mood-summary.dto';

type JournalEntryFilterQuery = Pick<
  QueryJournalEntryDto,
  'mood' | 'dateFrom' | 'dateTo' | 'tag' | 'search'
>;

/**
 * Encapsulates all Mongoose queries for JournalEntries (arch-use-repository-pattern).
 */
@Injectable()
export class JournalEntriesRepository {
  constructor(
    @InjectModel(JournalEntry.name)
    private readonly journalEntryModel: Model<JournalEntryDocument>,
  ) {}

  /**
   * Create a new journal entry
   */
  async create(
    scope: WorkspaceScope,
    dto: CreateJournalEntryDto,
  ): Promise<JournalEntryDocument> {
    const createdEntry = new this.journalEntryModel({
      ...dto,
      workspaceId: toObjectId(scope.workspaceId),
      userId: toObjectId(scope.userId),
      authorUserId: toObjectId(scope.userId),
      updatedBy: toObjectId(scope.userId),
      entryDate: dto.entryDate ? new Date(dto.entryDate) : new Date(),
    });
    return createdEntry.save();
  }

  /**
   * Find entry by ID and user ID
   */
  async findByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<JournalEntryDocument | null> {
    return this.journalEntryModel
      .findOne({
        _id: new Types.ObjectId(id.toString()),
        ...buildWorkspaceScopedFilter(scope, {
          userId: toObjectId(scope.userId),
        }),
      })
      .exec();
  }

  /**
   * Find entries with pagination and filters
   */
  async findWithPaginationAndFilters(
    scope: WorkspaceScope,
    query: QueryJournalEntryDto,
  ): Promise<{ items: JournalEntryDocument[]; total: number }> {
    const filter = this.buildEntryFilter(scope, query);

    // Sorting
    const sortObj: any = {};
    if (query.sortBy) {
      sortObj[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObj.entryDate = -1;
    }

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.journalEntryModel
        .find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.journalEntryModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  /**
   * Update entry by ID and user ID
   */
  async updateByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
    updateData: any,
  ): Promise<JournalEntryDocument | null> {
    // Convert entryDate if provided
    if (updateData.entryDate) {
      updateData.entryDate = new Date(updateData.entryDate);
    }

    return this.journalEntryModel
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

  /**
   * Delete entry by ID and user ID
   */
  async deleteByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<boolean> {
    const result = await this.journalEntryModel
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
   * Get mood summary for a user
   */
  async getMoodSummary(
    scope: WorkspaceScope,
    query: MoodSummaryQueryDto,
  ): Promise<{
    totalEntries: number;
    entriesWithMood: number;
    averageMood: number | null;
    moodDistribution: Array<{ mood: MoodLevel; count: number }>;
  }> {
    const matchStage = this.buildEntryFilter(scope, query);

    const result = await this.journalEntryModel
      .aggregate([
        { $match: matchStage },
        {
          $facet: {
            total: [{ $count: 'count' }],
            moodStats: [
              { $match: { mood: { $exists: true, $ne: null } } },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  avgMood: { $avg: '$mood' },
                },
              },
            ],
            moodDistribution: [
              { $match: { mood: { $exists: true, $ne: null } } },
              {
                $group: {
                  _id: '$mood',
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],
          },
        },
      ])
      .exec();

    const data = result[0];
    const totalEntries = data.total[0]?.count || 0;
    const moodStats = data.moodStats[0];
    const entriesWithMood = moodStats?.count || 0;
    const averageMood = moodStats?.avgMood || null;

    return {
      totalEntries,
      entriesWithMood,
      averageMood: averageMood ? Math.round(averageMood * 10) / 10 : null,
      moodDistribution: data.moodDistribution.map((item: any) => ({
        mood: item._id as MoodLevel,
        count: item.count,
      })),
    };
  }

  /**
   * Get mood trend over time (daily aggregation)
   */
  async getMoodTrend(
    scope: WorkspaceScope,
    query: MoodSummaryQueryDto,
  ): Promise<
    Array<{
      date: string;
      avgMood: number;
      entryCount: number;
    }>
  > {
    const matchStage = this.buildEntryFilter(scope, query);

    if (matchStage.mood === undefined) {
      matchStage.mood = { $exists: true, $ne: null };
    }

    const results = await this.journalEntryModel
      .aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$entryDate' },
            },
            avgMood: { $avg: '$mood' },
            entryCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: '$_id',
            avgMood: { $round: ['$avgMood', 1] },
            entryCount: 1,
          },
        },
      ])
      .exec();

    return results;
  }

  private buildEntryFilter(
    scope: WorkspaceScope,
    query: JournalEntryFilterQuery | MoodSummaryQueryDto,
  ) {
    const filter: Record<string, any> = {
      ...buildWorkspaceScopedFilter(scope, {
        userId: toObjectId(scope.userId),
      }),
    };

    if (query.mood !== undefined) {
      filter.mood = query.mood;
    }

    if (query.dateFrom || query.dateTo) {
      filter.entryDate = {};
      if (query.dateFrom) {
        filter.entryDate.$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        filter.entryDate.$lte = new Date(query.dateTo);
      }
    }

    if (query.tag) {
      filter.tags = query.tag;
    }

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    return filter;
  }
}
