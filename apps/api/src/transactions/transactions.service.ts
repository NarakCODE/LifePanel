import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TransactionsRepository } from './transactions.repository';
import { TransactionDocument } from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { TransactionResponseDto } from './dto/transaction-response.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly transactionsRepo: TransactionsRepository) {}

  async create(
    workspace: WorkspaceRequestContext,
    dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionsRepo.create(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      dto,
    );

    return this.toTransactionResponse(transaction);
  }

  async findByIdAndUser(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionsRepo.findByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return this.toTransactionResponse(transaction);
  }

  async findMany(
    workspace: WorkspaceRequestContext,
    query: QueryTransactionDto,
  ) {
    const { items, total } =
      await this.transactionsRepo.findWithPaginationAndFilters(
        { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
        query,
      );

    return {
      items: items.map((transaction) =>
        this.toTransactionResponse(transaction),
      ),
      total,
    };
  }

  async update(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionsRepo.updateByIdAndUser(
      id,
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      dto,
    );

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return this.toTransactionResponse(transaction);
  }

  async delete(id: string, workspace: WorkspaceRequestContext): Promise<void> {
    const deleted = await this.transactionsRepo.deleteByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!deleted) {
      throw new NotFoundException('Transaction not found');
    }
  }

  async getSummary(
    workspace: WorkspaceRequestContext,
    query: QueryTransactionDto,
  ) {
    return this.transactionsRepo.getSummaryByDateRange(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      query,
    );
  }

  private toTransactionResponse(
    transaction: TransactionDocument | Record<string, any>,
  ): TransactionResponseDto {
    const raw: Record<string, any> =
      typeof (transaction as TransactionDocument).toObject === 'function'
        ? ((transaction as TransactionDocument).toObject() as Record<
            string,
            any
          >)
        : (transaction as Record<string, any>);

    return new TransactionResponseDto({
      id: this.toIdString(raw._id ?? raw.id) ?? '',
      userId: this.toIdString(raw.userId) ?? '',
      budgetId: this.toIdString(raw.budgetId) ?? undefined,
      amount: Number(raw.amount ?? 0),
      type: raw.type,
      category: raw.category,
      description: raw.description ?? undefined,
      date: raw.date,
      currency: raw.currency,
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
