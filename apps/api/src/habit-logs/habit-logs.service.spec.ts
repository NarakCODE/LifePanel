import { Types } from 'mongoose';
import { HabitLogsService } from './habit-logs.service';

describe('HabitLogsService', () => {
  it('returns a serialized habit log response when create succeeds', async () => {
    const workspaceId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const habitId = new Types.ObjectId();
    const habitLogId = new Types.ObjectId();
    const createdAt = new Date('2026-03-23T06:10:00.000Z');
    const updatedAt = new Date('2026-03-23T06:10:00.000Z');

    const habitLogsRepo = {
      create: jest.fn().mockResolvedValue({
        toObject: () => ({
          _id: habitLogId,
          workspaceId,
          habitId,
          userId,
          actorUserId: userId,
          loggedDate: new Date('2026-03-23T00:00:00.000Z'),
          count: 1,
          notes: 'Kept the pace easy and added a longer cooldown.',
          createdAt,
          updatedAt,
        }),
      }),
    };
    const habitsService = {
      findByIdAndUser: jest.fn().mockResolvedValue({
        id: habitId.toString(),
      }),
    };

    const service = new HabitLogsService(
      habitLogsRepo as never,
      habitsService as never,
    );

    await expect(
      service.create(
        {
          workspaceId: workspaceId.toString(),
          actorUserId: userId.toString(),
        } as never,
        {
          habitId: habitId.toString(),
          loggedDate: new Date('2026-03-23T12:42:00.000Z'),
          count: 1,
          notes: 'Kept the pace easy and added a longer cooldown.',
        },
      ),
    ).resolves.toEqual({
      id: habitLogId.toString(),
      workspaceId: workspaceId.toString(),
      habitId: habitId.toString(),
      userId: userId.toString(),
      loggedDate: new Date('2026-03-23T00:00:00.000Z'),
      count: 1,
      notes: 'Kept the pace easy and added a longer cooldown.',
      createdAt,
      updatedAt,
    });

    expect(habitsService.findByIdAndUser).toHaveBeenCalledWith(
      habitId.toString(),
      expect.objectContaining({
        workspaceId: workspaceId.toString(),
        actorUserId: userId.toString(),
      }),
    );
    expect(habitLogsRepo.create).toHaveBeenCalledWith(
      {
        workspaceId: workspaceId.toString(),
        userId: userId.toString(),
      },
      {
        habitId: habitId.toString(),
        loggedDate: new Date('2026-03-23T00:00:00.000Z'),
        count: 1,
        notes: 'Kept the pace easy and added a longer cooldown.',
      },
    );
  });
});
