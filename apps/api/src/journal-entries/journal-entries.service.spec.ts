import { Types } from 'mongoose';
import { JournalEntriesService } from './journal-entries.service';
import { MoodLevel } from './schemas/journal-entry.schema';

describe('JournalEntriesService', () => {
  it('returns a serialized journal entry response when create succeeds', async () => {
    const workspaceId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const entryId = new Types.ObjectId();
    const createdAt = new Date('2026-03-23T06:50:00.000Z');
    const updatedAt = new Date('2026-03-23T06:50:00.000Z');
    const entryDate = new Date('2026-03-23T00:00:00.000Z');

    const journalEntriesRepo = {
      create: jest.fn().mockResolvedValue({
        toObject: () => ({
          _id: entryId,
          workspaceId,
          userId,
          authorUserId: userId,
          updatedBy: userId,
          entryDate,
          title: 'Steady progress',
          content: 'Felt more grounded after the afternoon walk.',
          mood: MoodLevel.GOOD,
          tags: ['mindfulness', 'gratitude'],
          createdAt,
          updatedAt,
        }),
      }),
    };

    const service = new JournalEntriesService(journalEntriesRepo as never);

    await expect(
      service.create(
        {
          workspaceId: workspaceId.toString(),
          actorUserId: userId.toString(),
        } as never,
        {
          entryDate,
          title: 'Steady progress',
          content: 'Felt more grounded after the afternoon walk.',
          mood: MoodLevel.GOOD,
          tags: ['mindfulness', 'gratitude'],
        },
      ),
    ).resolves.toEqual({
      id: entryId.toString(),
      workspaceId: workspaceId.toString(),
      userId: userId.toString(),
      authorUserId: userId.toString(),
      updatedBy: userId.toString(),
      entryDate,
      title: 'Steady progress',
      content: 'Felt more grounded after the afternoon walk.',
      mood: MoodLevel.GOOD,
      tags: ['mindfulness', 'gratitude'],
      createdAt,
      updatedAt,
    });

    expect(journalEntriesRepo.create).toHaveBeenCalledWith(
      {
        workspaceId: workspaceId.toString(),
        userId: userId.toString(),
      },
      {
        entryDate,
        title: 'Steady progress',
        content: 'Felt more grounded after the afternoon walk.',
        mood: MoodLevel.GOOD,
        tags: ['mindfulness', 'gratitude'],
      },
    );
  });

  it('passes active mood summary filters to the repository', async () => {
    const workspaceId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const journalEntriesRepo = {
      getMoodSummary: jest.fn().mockResolvedValue({
        totalEntries: 1,
        entriesWithMood: 1,
        averageMood: 4,
        moodDistribution: [{ mood: MoodLevel.GOOD, count: 1 }],
      }),
      getMoodTrend: jest
        .fn()
        .mockResolvedValue([{ date: '2026-03-23', avgMood: 4, entryCount: 1 }]),
    };

    const service = new JournalEntriesService(journalEntriesRepo as never);
    const query = {
      dateFrom: new Date('2026-03-01T00:00:00.000Z'),
      dateTo: new Date('2026-03-31T23:59:59.999Z'),
      mood: MoodLevel.GOOD,
      tag: 'focus',
      search: 'steady',
    };

    await expect(
      service.getMoodSummary(
        {
          workspaceId: workspaceId.toString(),
          actorUserId: userId.toString(),
        } as never,
        query,
      ),
    ).resolves.toMatchObject({
      totalEntries: 1,
      entriesWithMood: 1,
      averageMood: 4,
      moodDistribution: [
        {
          mood: MoodLevel.GOOD,
          label: 'Good',
          count: 1,
          percentage: 100,
        },
      ],
      trend: [{ date: '2026-03-23', avgMood: 4, entryCount: 1 }],
    });

    expect(journalEntriesRepo.getMoodSummary).toHaveBeenCalledWith(
      {
        workspaceId: workspaceId.toString(),
        userId: userId.toString(),
      },
      query,
    );
    expect(journalEntriesRepo.getMoodTrend).toHaveBeenCalledWith(
      {
        workspaceId: workspaceId.toString(),
        userId: userId.toString(),
      },
      query,
    );
  });
});
