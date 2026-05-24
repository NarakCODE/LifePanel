import { Types } from 'mongoose';
import { GoalsService } from './goals.service';
import { GoalStatus, GoalType } from './schemas/goal.schema';

describe('GoalsService', () => {
  it('returns a serialized goal response when create succeeds', async () => {
    const workspaceId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const goalId = new Types.ObjectId();
    const taskId = new Types.ObjectId();
    const habitId = new Types.ObjectId();
    const createdAt = new Date('2026-03-23T11:00:00.000Z');
    const updatedAt = new Date('2026-03-23T11:00:00.000Z');

    const goalsRepo = {
      create: jest.fn().mockResolvedValue({
        toObject: () => ({
          _id: goalId,
          workspaceId,
          userId,
          title: 'Ship goal links UI',
          description: 'Validate the goals experience end to end',
          type: GoalType.MIXED,
          targetValue: 10,
          currentValue: 4,
          unit: 'items',
          dueDate: new Date('2026-04-23T00:00:00.000Z'),
          status: GoalStatus.ACTIVE,
          progressLogs: [
            {
              value: 2,
              note: 'Initial setup complete',
              loggedAt: new Date('2026-03-23T08:00:00.000Z'),
            },
          ],
          linkedTasks: [taskId],
          linkedHabits: [habitId],
          createdAt,
          updatedAt,
        }),
      }),
    };

    const tasksService = {
      findByIdAndUser: jest.fn().mockResolvedValue({ id: taskId.toString() }),
    };
    const habitsService = {
      findByIdAndUser: jest.fn().mockResolvedValue({ id: habitId.toString() }),
    };

    const service = new GoalsService(
      goalsRepo as never,
      tasksService as never,
      habitsService as never,
    );

    await expect(
      service.create(
        {
          workspaceId: workspaceId.toString(),
          actorUserId: userId.toString(),
        } as never,
        {
          title: 'Ship goal links UI',
          description: 'Validate the goals experience end to end',
          type: GoalType.MIXED,
          targetValue: 10,
          currentValue: 4,
          unit: 'items',
          dueDate: new Date('2026-04-23T00:00:00.000Z'),
          status: GoalStatus.ACTIVE,
          linkedTasks: [taskId.toString()],
          linkedHabits: [habitId.toString()],
        } as never,
      ),
    ).resolves.toEqual({
      id: goalId.toString(),
      workspaceId: workspaceId.toString(),
      userId: userId.toString(),
      title: 'Ship goal links UI',
      description: 'Validate the goals experience end to end',
      type: GoalType.MIXED,
      targetValue: 10,
      currentValue: 4,
      unit: 'items',
      dueDate: new Date('2026-04-23T00:00:00.000Z'),
      status: GoalStatus.ACTIVE,
      progressLogs: [
        {
          value: 2,
          note: 'Initial setup complete',
          loggedAt: new Date('2026-03-23T08:00:00.000Z'),
        },
      ],
      linkedTasks: [taskId.toString()],
      linkedHabits: [habitId.toString()],
      progressPercent: 40,
      createdAt,
      updatedAt,
    });

    expect(goalsRepo.create).toHaveBeenCalledWith(
      {
        workspaceId: workspaceId.toString(),
        userId: userId.toString(),
      },
      expect.objectContaining({
        title: 'Ship goal links UI',
        type: GoalType.MIXED,
        targetValue: 10,
        linkedTasks: [taskId.toString()],
        linkedHabits: [habitId.toString()],
      }),
    );
    expect(tasksService.findByIdAndUser).toHaveBeenCalledWith(
      taskId.toString(),
      expect.objectContaining({
        workspaceId: workspaceId.toString(),
        actorUserId: userId.toString(),
      }),
    );
    expect(habitsService.findByIdAndUser).toHaveBeenCalledWith(
      habitId.toString(),
      expect.objectContaining({
        workspaceId: workspaceId.toString(),
        actorUserId: userId.toString(),
      }),
    );
  });
});
