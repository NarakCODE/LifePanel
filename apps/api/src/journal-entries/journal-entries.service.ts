import { Injectable, NotFoundException } from '@nestjs/common';
import { JournalEntryResponseDto } from './dto/journal-entry-response.dto';
import { JournalEntriesRepository } from './journal-entries.repository';
import {
  JournalEntryDocument,
  MoodLabels,
} from './schemas/journal-entry.schema';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';
import { QueryJournalEntryDto } from './dto/query-journal-entry.dto';
import {
  MoodSummaryQueryDto,
  MoodSummaryResponseDto,
} from './dto/mood-summary.dto';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';

@Injectable()
export class JournalEntriesService {
  constructor(private readonly journalEntriesRepo: JournalEntriesRepository) {}

  /**
   * Create a new journal entry
   */
  async create(
    workspace: WorkspaceRequestContext,
    dto: CreateJournalEntryDto,
  ): Promise<JournalEntryResponseDto> {
    const entry = await this.journalEntriesRepo.create(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      dto,
    );

    return this.toJournalEntryResponse(entry);
  }

  /**
   * Find entry by ID (user-scoped)
   */
  async findByIdAndUser(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<JournalEntryResponseDto> {
    const entry = await this.journalEntriesRepo.findByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }
    return this.toJournalEntryResponse(entry);
  }

  /**
   * Find entries with pagination and filters
   */
  async findMany(
    workspace: WorkspaceRequestContext,
    query: QueryJournalEntryDto,
  ): Promise<{ items: JournalEntryResponseDto[]; total: number }> {
    const { items, total } =
      await this.journalEntriesRepo.findWithPaginationAndFilters(
        { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
        query,
      );

    return {
      items: items.map((item) => this.toJournalEntryResponse(item)),
      total,
    };
  }

  /**
   * Update entry (user-scoped)
   */
  async update(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateJournalEntryDto,
  ): Promise<JournalEntryResponseDto> {
    const entry = await this.journalEntriesRepo.updateByIdAndUser(
      id,
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      dto,
    );
    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }
    return this.toJournalEntryResponse(entry);
  }

  /**
   * Delete entry (user-scoped)
   */
  async delete(id: string, workspace: WorkspaceRequestContext): Promise<void> {
    const deleted = await this.journalEntriesRepo.deleteByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!deleted) {
      throw new NotFoundException('Journal entry not found');
    }
  }

  /**
   * Get mood summary for a user
   */
  async getMoodSummary(
    workspace: WorkspaceRequestContext,
    query: MoodSummaryQueryDto,
  ): Promise<MoodSummaryResponseDto> {
    // Get summary data
    const summary = await this.journalEntriesRepo.getMoodSummary(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      query,
    );

    // Get trend data
    const trend = await this.journalEntriesRepo.getMoodTrend(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      query,
    );

    // Calculate mood distribution with percentages and labels
    const moodDistribution = summary.moodDistribution.map((item) => ({
      mood: item.mood,
      label: MoodLabels[item.mood],
      count: item.count,
      percentage:
        summary.entriesWithMood > 0
          ? Math.round((item.count / summary.entriesWithMood) * 100 * 10) / 10
          : 0,
    }));

    // Determine period dates
    const periodStart =
      query.dateFrom ||
      (trend.length > 0 ? new Date(trend[0]!.date) : new Date());
    const periodEnd =
      query.dateTo ||
      (trend.length > 0 ? new Date(trend[trend.length - 1]!.date) : new Date());

    return {
      totalEntries: summary.totalEntries,
      entriesWithMood: summary.entriesWithMood,
      averageMood: summary.averageMood,
      moodDistribution,
      trend,
      periodStart,
      periodEnd,
    };
  }

  private toJournalEntryResponse(
    entry: JournalEntryDocument | Record<string, any>,
  ): JournalEntryResponseDto {
    const raw: Record<string, any> =
      typeof (entry as JournalEntryDocument).toObject === 'function'
        ? ((entry as JournalEntryDocument).toObject() as Record<string, any>)
        : (entry as Record<string, any>);

    return new JournalEntryResponseDto({
      id: this.toIdString(raw._id ?? raw.id) ?? '',
      workspaceId: this.toIdString(raw.workspaceId),
      userId: this.toIdString(raw.userId) ?? '',
      authorUserId: this.toIdString(raw.authorUserId),
      updatedBy: this.toIdString(raw.updatedBy),
      entryDate: raw.entryDate,
      title: raw.title,
      content: raw.content,
      mood: raw.mood,
      tags: Array.isArray(raw.tags)
        ? raw.tags.filter((tag): tag is string => typeof tag === 'string')
        : [],
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  private toIdString(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && 'toString' in value) {
      return value.toString();
    }
    return null;
  }
}
