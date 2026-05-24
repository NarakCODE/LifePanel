import { Types } from 'mongoose';
import { HabitsService } from './habits.service';
import { HabitFrequency } from './schemas/habit.schema';

describe('HabitsService', () => {
  it('returns a serialized habit response when create succeeds', async () => {
    const workspaceId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const habitId = new Types.ObjectId();
    const createdAt = new Date('2026-03-23T10:00:00.000Z');
    const updatedAt = new Date('2026-03-23T10:00:00.000Z');

    const habitsRepo = {
      create: jest.fn().mockResolvedValue({
        toObject: () => ({
          _id: habitId,
          workspaceId,
          userId,
          name: 'Morning Exercise',
          description: '30 minutes of cardio',
          frequency: HabitFrequency.CUSTOM,
          customDays: [1, 2, 3, 4, 5],
          targetCount: 1,
          color: '#22c55e',
          status: 'active',
          startDate: new Date('2026-03-22T00:00:00.000Z'),
          endDate: null,
          archivedAt: null,
          currentStreak: 0,
          longestStreak: 0,
          createdAt,
          updatedAt,
        }),
      }),
    };
    const eventEmitter = {
      emit: jest.fn(),
    };

    const service = new HabitsService(
      habitsRepo as never,
      eventEmitter as never,
    );

    await expect(
      service.create(
        {
          workspaceId: workspaceId.toString(),
          actorUserId: userId.toString(),
        } as never,
        {
          name: 'Morning Exercise',
          frequency: HabitFrequency.CUSTOM,
          customDays: [1, 2, 3, 4, 5],
          color: '#22c55e',
        },
      ),
    ).resolves.toEqual({
      id: habitId.toString(),
      workspaceId: workspaceId.toString(),
      userId: userId.toString(),
      name: 'Morning Exercise',
      description: '30 minutes of cardio',
      frequency: HabitFrequency.CUSTOM,
      customDays: [1, 2, 3, 4, 5],
      targetCount: 1,
      color: '#22c55e',
      status: 'active',
      startDate: new Date('2026-03-22T00:00:00.000Z'),
      endDate: null,
      archivedAt: null,
      currentStreak: 0,
      longestStreak: 0,
      isActive: true,
      createdAt,
      updatedAt,
    });

    expect(habitsRepo.create).toHaveBeenCalledWith(
      {
        workspaceId: workspaceId.toString(),
        userId: userId.toString(),
      },
      expect.objectContaining({
        name: 'Morning Exercise',
        frequency: HabitFrequency.CUSTOM,
        customDays: [1, 2, 3, 4, 5],
        color: '#22c55e',
        startDate: expect.any(Date),
      }),
    );
  });
});
