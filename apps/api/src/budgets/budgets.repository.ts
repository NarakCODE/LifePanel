import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  buildWorkspaceScopedFilter,
  toObjectId,
  WorkspaceScope,
} from '../common/utils/workspace-scope.util';
import { Budget, BudgetDocument } from './schemas/budget.schema';
import { CreateBudgetDto } from './dto/create-budget.dto';

@Injectable()
export class BudgetsRepository {
  constructor(
    @InjectModel(Budget.name)
    private readonly budgetModel: Model<BudgetDocument>,
  ) {}

  async create(
    scope: WorkspaceScope,
    dto: CreateBudgetDto,
  ): Promise<BudgetDocument> {
    const createdBudget = new this.budgetModel({
      ...dto,
      workspaceId: toObjectId(scope.workspaceId),
      userId: toObjectId(scope.userId),
      createdBy: toObjectId(scope.userId),
      updatedBy: toObjectId(scope.userId),
    });
    return createdBudget.save();
  }

  async findByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<BudgetDocument | null> {
    return this.budgetModel
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
    query: any,
  ): Promise<{ items: BudgetDocument[]; total: number }> {
    const filter: any = buildWorkspaceScopedFilter(scope, {
      userId: toObjectId(scope.userId),
    });

    if (query.category) filter.category = query.category;
    if (query.period) filter.period = query.period;
    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.isArchived !== undefined) filter.isArchived = query.isArchived;
    if (query.parentBudgetId) filter.parentBudgetId = new Types.ObjectId(query.parentBudgetId);

    if (query.tags && Array.isArray(query.tags) && query.tags.length > 0) {
      filter.tags = { $in: query.tags };
    }

    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }

    const sortObj: any = {};
    if (query.sortBy) {
      sortObj[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObj.createdAt = -1;
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.budgetModel
        .find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.budgetModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async updateByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
    updateData: any,
  ): Promise<BudgetDocument | null> {
    return this.budgetModel
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

  async bulkUpdate(
    scope: WorkspaceScope,
    budgetIds: string[],
    updateData: any,
  ): Promise<{ modifiedCount: number }> {
    const objectIds = budgetIds.map((id) => new Types.ObjectId(id));
    const result = await this.budgetModel.updateMany(
      {
        _id: { $in: objectIds },
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
    );

    return { modifiedCount: result.modifiedCount };
  }

  async bulkDelete(
    scope: WorkspaceScope,
    budgetIds: string[],
  ): Promise<{ deletedCount: number }> {
    const objectIds = budgetIds.map((id) => new Types.ObjectId(id));
    const result = await this.budgetModel.deleteMany({
      _id: { $in: objectIds },
      ...buildWorkspaceScopedFilter(scope, {
        userId: toObjectId(scope.userId),
      }),
    });

    return { deletedCount: result.deletedCount };
  }

  async deleteByIdAndUser(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<boolean> {
    const result = await this.budgetModel
      .deleteOne({
        _id: new Types.ObjectId(id.toString()),
        ...buildWorkspaceScopedFilter(scope, {
          userId: toObjectId(scope.userId),
        }),
      })
      .exec();

    return result.deletedCount > 0;
  }

  async getBudgetSummary(scope: WorkspaceScope, query: any): Promise<any[]> {
    const userObjectId = toObjectId(scope.userId);
    const matchStage: any = buildWorkspaceScopedFilter(scope, {
      userId: userObjectId,
    });

    if (query.category) {
      matchStage.category = query.category;
    }
    if (query.period) {
      matchStage.period = query.period;
    }
    if (query.isActive !== undefined) {
      matchStage.isActive = query.isActive;
    }

    const result = await this.budgetModel
      .aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'transactions',
            let: {
              bUserId: '$userId',
              bWorkspaceId: '$workspaceId',
              bCategory: '$category',
              bStartDate: '$startDate',
              bEndDate: '$endDate',
              bId: '$_id',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $or: [
                          { $eq: ['$budgetId', '$$bId'] },
                          {
                            $and: [
                              { $eq: ['$budgetId', null] },
                              {
                                $or: [
                                  { $eq: ['$workspaceId', '$$bWorkspaceId'] },
                                  {
                                    $and: [
                                      { $eq: ['$workspaceId', null] },
                                      { $eq: ['$userId', '$$bUserId'] },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                      { $eq: ['$type', 'expense'] },
                      {
                        $cond: {
                          if: { $ne: ['$$bCategory', null] },
                          then: { $eq: ['$category', '$$bCategory'] },
                          else: true,
                        },
                      },
                      {
                        $cond: {
                          if: { $ne: ['$$bStartDate', null] },
                          then: { $gte: ['$date', '$$bStartDate'] },
                          else: true,
                        },
                      },
                      {
                        $cond: {
                          if: { $ne: ['$$bEndDate', null] },
                          then: { $lte: ['$date', '$$bEndDate'] },
                          else: true,
                        },
                      },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  spent: { $sum: '$amount' },
                },
              },
            ],
            as: 'transactionDetails',
          },
        },
        {
          $addFields: {
            actualSpending: {
              $cond: {
                if: { $gt: [{ $size: '$transactionDetails' }, 0] },
                then: { $arrayElemAt: ['$transactionDetails.spent', 0] },
                else: 0,
              },
            },
          },
        },
        {
          $project: {
            transactionDetails: 0,
          },
        },
      ])
      .exec();

    return result.map((budget: any) => {
      const budgetAmount = budget.amount;
      const actualSpending = budget.actualSpending;
      const remainingAmount = budgetAmount - actualSpending;
      const percentUsed =
        budgetAmount > 0 ? (actualSpending / budgetAmount) * 100 : 0;
      const alertThreshold = budget.alertThreshold ?? 80;

      let health: 'healthy' | 'warning' | 'critical' | 'over_budget';
      if (percentUsed > 100) {
        health = 'over_budget';
      } else if (percentUsed >= alertThreshold) {
        health = 'critical';
      } else if (percentUsed >= alertThreshold * 0.75) {
        health = 'warning';
      } else {
        health = 'healthy';
      }

      return {
        ...budget,
        remainingAmount,
        percentUsed: Math.round(percentUsed * 100) / 100,
        isOverBudget: actualSpending > budgetAmount,
        health,
        alertTriggered: percentUsed >= alertThreshold,
      };
    });
  }

  async getBudgetTrend(
    scope: WorkspaceScope,
    budgetId: string,
    options: {
      granularity: 'daily' | 'weekly' | 'monthly';
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<any[]> {
    const budget = await this.findByIdAndUser(budgetId, scope);
    if (!budget) return [];

    const budgetStartDate = options.startDate || budget.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const budgetEndDate = options.endDate || budget.endDate || new Date();

    const granularity = options.granularity;
    let dateFormat: string;
    let dateGroup: any;

    switch (granularity) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        dateGroup = {
          $dateToString: { format: dateFormat, date: '$date' },
        };
        break;
      case 'weekly':
        dateFormat = '%Y-W%V';
        dateGroup = {
          $dateToString: { format: dateFormat, date: '$date' },
        };
        break;
      case 'monthly':
      default:
        dateFormat = '%Y-%m';
        dateGroup = {
          $dateToString: { format: dateFormat, date: '$date' },
        };
        break;
    }

    const trend = await this.budgetModel.db
      .collection('transactions')
      .aggregate([
        {
          $match: {
            $expr: {
              $and: [
                {
                  $or: [
                    { $eq: ['$budgetId', new Types.ObjectId(budgetId)] },
                    {
                      $and: [
                        { $eq: ['$budgetId', null] },
                        {
                          $or: [
                            {
                              $eq: [
                                '$workspaceId',
                                budget.workspaceId
                                  ? new Types.ObjectId(budget.workspaceId.toString())
                                  : null,
                              ],
                            },
                            {
                              $and: [
                                { $eq: ['$workspaceId', null] },
                                { $eq: ['$userId', new Types.ObjectId(budget.userId.toString())] },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                { $eq: ['$type', 'expense'] },
                { $gte: ['$date', budgetStartDate] },
                { $lte: ['$date', budgetEndDate] },
                budget.category
                  ? { $eq: ['$category', budget.category] }
                  : true,
              ],
            },
          },
        },
        {
          $group: {
            _id: dateGroup,
            totalSpent: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
            avgAmount: { $avg: '$amount' },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .toArray();

    return trend.map((item: any) => ({
      period: item._id,
      totalSpent: item.totalSpent,
      transactionCount: item.transactionCount,
      avgAmount: Math.round(item.avgAmount * 100) / 100,
      budgetAmount: budget.amount,
      remaining: Math.max(0, budget.amount - item.totalSpent),
      percentUsed:
        budget.amount > 0
          ? Math.round((item.totalSpent / budget.amount) * 10000) / 100
          : 0,
    }));
  }

  async getBudgetsByCategory(
    scope: WorkspaceScope,
  ): Promise<{ category: string; count: number; totalBudget: number }[]> {
    const matchStage = buildWorkspaceScopedFilter(scope, {
      userId: toObjectId(scope.userId),
    });

    return this.budgetModel
      .aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalBudget: { $sum: '$amount' },
          },
        },
        {
          $project: {
            _id: 0,
            category: { $ifNull: ['$_id', 'Uncategorized'] },
            count: 1,
            totalBudget: 1,
          },
        },
        { $sort: { totalBudget: -1 } },
      ])
      .exec();
  }

  async getBudgetsByPeriod(
    scope: WorkspaceScope,
  ): Promise<{ period: string; count: number; totalBudget: number; avgBudget: number }[]> {
    const matchStage = buildWorkspaceScopedFilter(scope, {
      userId: toObjectId(scope.userId),
    });

    return this.budgetModel
      .aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$period',
            count: { $sum: 1 },
            totalBudget: { $sum: '$amount' },
            avgBudget: { $avg: '$amount' },
          },
        },
        {
          $project: {
            _id: 0,
            period: '$_id',
            count: 1,
            totalBudget: 1,
            avgBudget: { $round: ['$avgBudget', 2] },
          },
        },
        { $sort: { count: -1 } },
      ])
      .exec();
  }
}
