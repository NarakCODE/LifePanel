import { Types } from 'mongoose';
import { TransactionsService } from './transactions.service';
import {
  TransactionCategory,
  TransactionType,
} from './schemas/transaction.schema';

describe('TransactionsService', () => {
  it('returns a normalized transaction response when create succeeds', async () => {
    const workspaceId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const transactionId = new Types.ObjectId();
    const createdAt = new Date('2026-03-24T00:00:00.000Z');
    const updatedAt = new Date('2026-03-24T00:00:00.000Z');
    const transactionsRepo = {
      create: jest.fn().mockResolvedValue({
        toObject: () => ({
          _id: transactionId,
          workspaceId,
          userId,
          budgetId: null,
          amount: 25,
          type: TransactionType.EXPENSE,
          category: TransactionCategory.OTHER,
          description: 'Lunch',
          date: new Date('2026-03-23T00:00:00.000Z'),
          currency: 'USD',
          createdAt,
          updatedAt,
        }),
      }),
    };

    const service = new TransactionsService(transactionsRepo as never);

    await expect(
      service.create(
        {
          workspaceId: workspaceId.toString(),
          actorUserId: userId.toString(),
        } as never,
        {
          amount: 25,
          type: TransactionType.EXPENSE,
          category: TransactionCategory.OTHER,
          description: 'Lunch',
          date: new Date('2026-03-23T00:00:00.000Z'),
          currency: 'USD',
        },
      ),
    ).resolves.toEqual({
      id: transactionId.toString(),
      userId: userId.toString(),
      budgetId: undefined,
      amount: 25,
      type: TransactionType.EXPENSE,
      category: TransactionCategory.OTHER,
      description: 'Lunch',
      date: new Date('2026-03-23T00:00:00.000Z'),
      currency: 'USD',
      createdAt,
      updatedAt,
    });
  });

  it('normalizes list results into response DTO items', async () => {
    const userId = new Types.ObjectId();
    const transactionId = new Types.ObjectId();
    const transactionsRepo = {
      findWithPaginationAndFilters: jest.fn().mockResolvedValue({
        items: [
          {
            toObject: () => ({
              _id: transactionId,
              userId,
              budgetId: null,
              amount: 80,
              type: TransactionType.INCOME,
              category: TransactionCategory.SALARY,
              description: 'Payroll',
              date: new Date('2026-03-24T00:00:00.000Z'),
              currency: 'usd',
              createdAt: new Date('2026-03-24T00:00:00.000Z'),
              updatedAt: new Date('2026-03-24T00:00:00.000Z'),
            }),
          },
        ],
        total: 1,
      }),
    };

    const service = new TransactionsService(transactionsRepo as never);

    await expect(
      service.findMany(
        {
          workspaceId: new Types.ObjectId().toString(),
          actorUserId: userId.toString(),
        } as never,
        {} as never,
      ),
    ).resolves.toEqual({
      items: [
        {
          id: transactionId.toString(),
          userId: userId.toString(),
          budgetId: undefined,
          amount: 80,
          type: TransactionType.INCOME,
          category: TransactionCategory.SALARY,
          description: 'Payroll',
          date: new Date('2026-03-24T00:00:00.000Z'),
          currency: 'usd',
          createdAt: new Date('2026-03-24T00:00:00.000Z'),
          updatedAt: new Date('2026-03-24T00:00:00.000Z'),
        },
      ],
      total: 1,
    });
  });
});
