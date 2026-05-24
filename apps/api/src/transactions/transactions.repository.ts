import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  buildWorkspaceScopedFilter,
  toObjectId,
  WorkspaceScope,
} from '../common/utils/workspace-scope.util';
import {
  Transaction,
  TransactionCategory,
  TransactionDocument,
} from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

/**
 * Encapsulates all Mongoose queries for Transactions (arch-use-repository-pattern).
 */
@Injectable()
export class TransactionsRepository {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  async create(
    scope: WorkspaceScope,
    dto: CreateTransactionDto,
  ): Promise<TransactionDocument> {
    const createdTransaction = new this.transactionModel({
      ...dto,
      budgetId: dto.budgetId ? new Types.ObjectId(dto.budgetId) : null,
      currency: dto.currency?.toUpperCase() ?? 'USD',
      workspaceId: toObjectId(scope.workspaceId),
      userId: toObjectId(scope.userId),
      createdBy: toObjectId(scope.userId),
      updatedBy: toObjectId(scope.userId),
    });

    return createdTransaction.save();
  }

  async findByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<TransactionDocument | null> {
    return this.transactionModel
      .findOne({
        _id: new Types.ObjectId(id.toString()),
        ...buildWorkspaceScopedFilter(scope, {
          userId: toObjectId(scope.userId),
        }),
      })
      .exec();
  }

  async findWithPaginationAndFilters(
    scope: WorkspaceScope,
    query: QueryTransactionDto,
  ): Promise<{ items: TransactionDocument[]; total: number }> {
    const filter = this.buildFilter(scope, query);
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .sort(this.buildSort(query))
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async findByBudgetCategory(
    scope: WorkspaceScope,
    category: string,
    query: QueryTransactionDto,
  ): Promise<{ items: TransactionDocument[]; total: number }> {
    const scopedQuery = new QueryTransactionDto();
    Object.assign(scopedQuery, query, {
      category: query.category ?? (category as TransactionCategory),
    });

    return this.findWithPaginationAndFilters(scope, scopedQuery);
  }

  async getSummaryByDateRange(
    scope: WorkspaceScope,
    query: QueryTransactionDto,
  ): Promise<{
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    transactionCount: number;
    byCategory: Array<{ category: string; totalAmount: number; count: number }>;
    byType: Array<{ type: string; totalAmount: number; count: number }>;
  }> {
    const matchStage = this.buildFilter(scope, query);

    const [result] = await this.transactionModel
      .aggregate([
        { $match: matchStage },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  totalIncome: {
                    $sum: {
                      $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
                    },
                  },
                  totalExpense: {
                    $sum: {
                      $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
                    },
                  },
                  transactionCount: { $sum: 1 },
                },
              },
            ],
            byCategory: [
              {
                $group: {
                  _id: '$category',
                  totalAmount: { $sum: '$amount' },
                  count: { $sum: 1 },
                },
              },
              { $sort: { totalAmount: -1 } },
            ],
            byType: [
              {
                $group: {
                  _id: '$type',
                  totalAmount: { $sum: '$amount' },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],
          },
        },
      ])
      .exec();

    const totals = result?.totals?.[0] ?? {
      totalIncome: 0,
      totalExpense: 0,
      transactionCount: 0,
    };

    return {
      totalIncome: totals.totalIncome,
      totalExpense: totals.totalExpense,
      netAmount: totals.totalIncome - totals.totalExpense,
      transactionCount: totals.transactionCount,
      byCategory: (result?.byCategory ?? []).map((item: any) => ({
        category: item._id,
        totalAmount: item.totalAmount,
        count: item.count,
      })),
      byType: (result?.byType ?? []).map((item: any) => ({
        type: item._id,
        totalAmount: item.totalAmount,
        count: item.count,
      })),
    };
  }

  async updateByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
    updateData: UpdateTransactionDto,
  ): Promise<TransactionDocument | null> {
    const normalizedUpdateData = {
      ...updateData,
      ...(updateData.budgetId
        ? { budgetId: new Types.ObjectId(updateData.budgetId) }
        : {}),
      ...(updateData.currency
        ? { currency: updateData.currency.toUpperCase() }
        : {}),
    };

    return this.transactionModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id.toString()),
          ...buildWorkspaceScopedFilter(scope, {
            userId: toObjectId(scope.userId),
          }),
        },
        {
          $set: {
            ...normalizedUpdateData,
            updatedBy: toObjectId(scope.userId),
          },
        },
        { new: true },
      )
      .exec();
  }

  async deleteByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<boolean> {
    const result = await this.transactionModel
      .deleteOne({
        _id: new Types.ObjectId(id.toString()),
        ...buildWorkspaceScopedFilter(scope, {
          userId: toObjectId(scope.userId),
        }),
      })
      .exec();

    return result.deletedCount > 0;
  }

  private buildFilter(scope: WorkspaceScope, query: QueryTransactionDto) {
    const filter: Record<string, unknown> = buildWorkspaceScopedFilter(scope, {
      userId: toObjectId(scope.userId),
    });

    if (query.type) {
      filter.type = query.type;
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.budgetId) {
      filter.budgetId = new Types.ObjectId(query.budgetId);
    }

    if (query.currency) {
      filter.currency = query.currency.toUpperCase();
    }

    if (query.dateFrom || query.dateTo) {
      filter.date = {};

      if (query.dateFrom) {
        (filter.date as Record<string, unknown>).$gte = query.dateFrom;
      }

      if (query.dateTo) {
        (filter.date as Record<string, unknown>).$lte = query.dateTo;
      }
    }

    if (query.search) {
      filter.description = { $regex: query.search, $options: 'i' };
    }

    return filter;
  }

  private buildSort(query: QueryTransactionDto): Record<string, 1 | -1> {
    if (query.sortBy) {
      const sort: Record<string, 1 | -1> = {};
      sort[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;
      return sort;
    }

    return { date: -1 };
  }
}
