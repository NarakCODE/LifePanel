import { Types } from 'mongoose';
import { BudgetsService } from './budgets.service';
import { BudgetPeriod } from './schemas/budget.schema';

describe('BudgetsService', () => {
  it('returns a serialized budget response when create succeeds', async () => {
    const workspaceId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const budgetId = new Types.ObjectId();
    const createdAt = new Date('2026-03-23T12:00:00.000Z');
    const updatedAt = new Date('2026-03-23T12:00:00.000Z');

    const budgetsRepo = {
      create: jest.fn().mockResolvedValue({
        toObject: () => ({
          _id: budgetId,
          workspaceId,
          userId,
          name: 'Monthly operations',
          amount: 2500,
          category: 'operations',
          period: BudgetPeriod.MONTHLY,
          startDate: new Date('2026-03-01T00:00:00.000Z'),
          endDate: new Date('2026-03-31T23:59:59.999Z'),
          currency: 'USD',
          isActive: true,
          createdAt,
          updatedAt,
        }),
      }),
    };

    const service = new BudgetsService(budgetsRepo as never);

    await expect(
      service.create(
        {
          workspaceId: workspaceId.toString(),
          actorUserId: userId.toString(),
        } as never,
        {
          name: 'Monthly operations',
          amount: 2500,
          category: 'operations',
          period: BudgetPeriod.MONTHLY,
          startDate: new Date('2026-03-01T00:00:00.000Z'),
          endDate: new Date('2026-03-31T23:59:59.999Z'),
          currency: 'USD',
        },
      ),
    ).resolves.toEqual({
      id: budgetId.toString(),
      workspaceId: workspaceId.toString(),
      userId: userId.toString(),
      name: 'Monthly operations',
      amount: 2500,
      category: 'operations',
      period: BudgetPeriod.MONTHLY,
      startDate: new Date('2026-03-01T00:00:00.000Z'),
      endDate: new Date('2026-03-31T23:59:59.999Z'),
      currency: 'USD',
      isActive: true,
      actualSpending: undefined,
      remainingAmount: undefined,
      percentUsed: undefined,
      isOverBudget: undefined,
      createdAt,
      updatedAt,
    });

    expect(budgetsRepo.create).toHaveBeenCalledWith(
      {
        workspaceId: workspaceId.toString(),
        userId: userId.toString(),
      },
      expect.objectContaining({
        name: 'Monthly operations',
        amount: 2500,
        category: 'operations',
        period: BudgetPeriod.MONTHLY,
        currency: 'USD',
      }),
    );
  });
});
