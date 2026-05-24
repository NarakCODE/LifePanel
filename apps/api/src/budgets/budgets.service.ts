import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { BudgetsRepository } from './budgets.repository';
import { BudgetDocument, BudgetHealth } from './schemas/budget.schema';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { BudgetResponseDto } from './dto/budget-response.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { QueryBudgetDto } from './dto/query-budget.dto';
import { BulkBudgetDto, BulkAction } from './dto/bulk-budget.dto';
import { QueryBudgetTrendDto, TrendGranularity } from './dto/query-budget-trend.dto';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';

@Injectable()
export class BudgetsService {
  constructor(private readonly budgetsRepo: BudgetsRepository) {}

  async create(
    workspace: WorkspaceRequestContext,
    dto: CreateBudgetDto,
  ): Promise<BudgetResponseDto> {
    const budget = await this.budgetsRepo.create(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      dto,
    );
    return this.toBudgetResponse(budget);
  }

  async findByIdAndUser(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<BudgetResponseDto> {
    const budget = await this.budgetsRepo.findByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    return this.toBudgetResponse(budget);
  }

  async findMany(workspace: WorkspaceRequestContext, query: QueryBudgetDto) {
    const { items, total } =
      await this.budgetsRepo.findWithPaginationAndFilters(
        { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
        query,
      );

    return {
      items: items.map((budget) => this.toBudgetResponse(budget)),
      total,
    };
  }

  async update(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateBudgetDto,
  ): Promise<BudgetResponseDto> {
    const budget = await this.budgetsRepo.updateByIdAndUser(
      id,
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      dto,
    );
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    return this.toBudgetResponse(budget);
  }

  async delete(id: string, workspace: WorkspaceRequestContext): Promise<void> {
    const deleted = await this.budgetsRepo.deleteByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!deleted) {
      throw new NotFoundException('Budget not found');
    }
  }

  async bulkAction(
    workspace: WorkspaceRequestContext,
    dto: BulkBudgetDto,
  ): Promise<{ success: boolean; modifiedCount?: number; deletedCount?: number }> {
    const scope = { workspaceId: workspace.workspaceId, userId: workspace.actorUserId };

    switch (dto.action) {
      case BulkAction.ACTIVATE:
        const activated = await this.budgetsRepo.bulkUpdate(scope, dto.budgetIds, { isActive: true });
        return { success: true, modifiedCount: activated.modifiedCount };

      case BulkAction.DEACTIVATE:
        const deactivated = await this.budgetsRepo.bulkUpdate(scope, dto.budgetIds, { isActive: false });
        return { success: true, modifiedCount: deactivated.modifiedCount };

      case BulkAction.ARCHIVE:
        const archived = await this.budgetsRepo.bulkUpdate(scope, dto.budgetIds, {
          isArchived: true,
          archivedAt: new Date(),
        });
        return { success: true, modifiedCount: archived.modifiedCount };

      case BulkAction.DELETE:
        const deleted = await this.budgetsRepo.bulkDelete(scope, dto.budgetIds);
        return { success: true, deletedCount: deleted.deletedCount };

      default:
        throw new BadRequestException(`Unknown bulk action: ${dto.action}`);
    }
  }

  async getBudgetTrend(
    id: string,
    workspace: WorkspaceRequestContext,
    query: QueryBudgetTrendDto,
  ) {
    const granularity = query.granularity || TrendGranularity.DAILY;
    const options = {
      granularity,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    };

    return this.budgetsRepo.getBudgetTrend(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      id,
      options,
    );
  }

  async getBudgetSummary(
    workspace: WorkspaceRequestContext,
    query: QueryBudgetDto,
  ) {
    const budgets = await this.budgetsRepo.getBudgetSummary(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      query,
    );

    return budgets.map((budget) => this.toBudgetResponse(budget));
  }

  async getBudgetsByCategory(workspace: WorkspaceRequestContext) {
    return this.budgetsRepo.getBudgetsByCategory({
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
  }

  async getBudgetsByPeriod(workspace: WorkspaceRequestContext) {
    return this.budgetsRepo.getBudgetsByPeriod({
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
  }

  private toBudgetResponse(
    budget: BudgetDocument | Record<string, any>,
  ): BudgetResponseDto {
    const raw: Record<string, any> =
      typeof (budget as BudgetDocument).toObject === 'function'
        ? ((budget as BudgetDocument).toObject() as Record<string, any>)
        : (budget as Record<string, any>);

    const percentUsed = raw.percentUsed !== undefined ? Number(raw.percentUsed) : undefined;
    const alertThreshold = raw.alertThreshold ?? 80;

    let health: BudgetHealth | undefined;
    if (percentUsed !== undefined) {
      if (percentUsed > 100) {
        health = BudgetHealth.OVER_BUDGET;
      } else if (percentUsed >= alertThreshold) {
        health = BudgetHealth.CRITICAL;
      } else if (percentUsed >= alertThreshold * 0.75) {
        health = BudgetHealth.WARNING;
      } else {
        health = BudgetHealth.HEALTHY;
      }
    }

    return new BudgetResponseDto({
      id: this.toIdString(raw._id ?? raw.id) ?? '',
      workspaceId: this.toIdString(raw.workspaceId),
      userId: this.toIdString(raw.userId) ?? '',
      name: raw.name,
      amount: Number(raw.amount ?? 0),
      category: raw.category,
      period: raw.period,
      startDate: raw.startDate ?? null,
      endDate: raw.endDate ?? null,
      currency: raw.currency,
      isActive: Boolean(raw.isActive),
      description: raw.description,
      color: raw.color,
      alertThreshold: raw.alertThreshold,
      tags: raw.tags || [],
      parentBudgetId: this.toIdString(raw.parentBudgetId),
      isArchived: Boolean(raw.isArchived),
      archivedAt: raw.archivedAt,
      actualSpending:
        raw.actualSpending === undefined
          ? undefined
          : Number(raw.actualSpending),
      remainingAmount:
        raw.remainingAmount === undefined
          ? undefined
          : Number(raw.remainingAmount),
      percentUsed:
        raw.percentUsed === undefined ? undefined : Number(raw.percentUsed),
      isOverBudget:
        raw.isOverBudget === undefined ? undefined : Boolean(raw.isOverBudget),
      health,
      alertTriggered:
        raw.alertTriggered === undefined
          ? undefined
          : Boolean(raw.alertTriggered),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  private toIdString(
    value: Types.ObjectId | string | null | undefined,
  ): string | null {
    if (!value) return null;
    return typeof value === 'string' ? value : value.toString();
  }
}
