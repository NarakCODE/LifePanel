import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

describe('DashboardService', () => {
  const mockWorkspace = {
    workspaceId: 'workspace-1',
    actorUserId: 'user-1',
  } as never;

  const createMockTasksService = () => ({
    getTaskOverview: jest.fn().mockResolvedValue({
      totalTasks: 10,
      countsByStatus: { todo: 3, in_progress: 2, done: 4, archived: 1 },
      overdueCount: 1,
      upcomingCount: 5,
    }),
    findMany: jest.fn().mockResolvedValue({
      data: {
        tasks: [{ id: 't1', name: 'Task 1' }],
        pagination: { total: 1, page: 1, limit: 5, totalPages: 1 },
      },
      meta: { filterCounts: {} },
    }),
  });

  const createMockIssuesService = () => ({
    getIssueOverview: jest.fn().mockResolvedValue({
      total: 5,
      countsByStatus: {
        backlog: 1,
        todo: 1,
        in_progress: 1,
        in_review: 0,
        done: 1,
        canceled: 1,
      },
      overdueCount: 0,
    }),
    findMany: jest.fn().mockResolvedValue({
      data: {
        issues: [{ id: 'i1', title: 'Issue 1' }],
        pagination: { total: 1, page: 1, limit: 5, totalPages: 1 },
      },
    }),
  });

  const createMockGoalsService = () => ({
    getGoalOverview: jest.fn().mockResolvedValue({
      total: 3,
      countsByStatus: { active: 2, completed: 1, archived: 0 },
      avgProgressPercent: 45,
    }),
    findMany: jest.fn().mockResolvedValue({
      items: [
        {
          id: 'g1',
          title: 'Goal 1',
          progressPercent: 50,
          status: 'active',
        },
      ],
      total: 1,
    }),
  });

  const createMockHabitsService = () => ({
    getHabitOverview: jest.fn().mockResolvedValue({
      total: 4,
      activeCount: 3,
      archivedCount: 1,
      longestStreak: 21,
      avgStreak: 7.5,
    }),
    findMany: jest.fn().mockResolvedValue({
      items: [
        {
          id: 'h1',
          name: 'Habit 1',
          currentStreak: 5,
          longestStreak: 10,
        },
      ],
      total: 1,
    }),
  });

  const createMockTransactionsService = () => ({
    getSummary: jest.fn().mockResolvedValue({
      totalIncome: 1000,
      totalExpense: 500,
      netAmount: 500,
      transactionCount: 5,
      byCategory: [{ category: 'food', totalAmount: 200, count: 2 }],
      byType: [{ type: 'expense', totalAmount: 500, count: 5 }],
    }),
    findMany: jest.fn().mockResolvedValue({
      items: [{ id: 'tx1', amount: 100, type: 'expense' }],
      total: 1,
    }),
  });

  const createMockBudgetsService = () => ({
    getBudgetSummary: jest.fn().mockResolvedValue([
      {
        id: 'b1',
        name: 'Budget 1',
        percentUsed: 60,
        isOverBudget: false,
      },
    ]),
  });

  const createMockNotificationsService = () => ({
    getUnreadCount: jest.fn().mockResolvedValue({ count: 3 }),
    findMany: jest.fn().mockResolvedValue({
      data: [{ id: 'n1', title: 'Notification 1' }],
      meta: { total: 1, page: 1, limit: 5, totalPages: 1 },
    }),
  });

  const createMockProjectsService = () => ({
    getProjectOverview: jest.fn().mockResolvedValue({
      total: 2,
      countsByStatus: {
        backlog: 0,
        planned: 0,
        active: 2,
        completed: 0,
        cancelled: 0,
      },
    }),
    findAllAccessible: jest.fn().mockResolvedValue([
      { id: 'p1', name: 'Project 1' },
      { id: 'p2', name: 'Project 2' },
    ]),
  });

  const createMockNotesService = () => ({
    getNoteOverview: jest.fn().mockResolvedValue({
      total: 6,
      countsByStatus: { completed: 5, processing: 1 },
    }),
    findMany: jest.fn().mockResolvedValue({
      notes: [{ id: 'note1', title: 'Note 1' }],
      pagination: { total: 1, page: 1, limit: 5, totalPages: 1 },
    }),
  });

  const createMockJournalEntriesService = () => ({
    getMoodSummary: jest.fn().mockResolvedValue({
      totalEntries: 10,
      entriesWithMood: 8,
      averageMood: 3.5,
      moodDistribution: [{ mood: 3, label: 'Okay', count: 5, percentage: 50 }],
      trend: [{ date: '2026-05-01', avgMood: 3.5, entryCount: 2 }],
      periodStart: new Date('2026-05-01'),
      periodEnd: new Date('2026-05-19'),
    }),
    findMany: jest.fn().mockResolvedValue({
      items: [{ id: 'j1', title: 'Journal 1' }],
      total: 1,
    }),
  });

  const buildService = () => {
    return new DashboardService(
      createMockTasksService() as never,
      createMockIssuesService() as never,
      createMockGoalsService() as never,
      createMockHabitsService() as never,
      createMockTransactionsService() as never,
      createMockBudgetsService() as never,
      createMockNotificationsService() as never,
      createMockProjectsService() as never,
      createMockNotesService() as never,
      createMockJournalEntriesService() as never,
    );
  };

  it('returns aggregated summary with safe defaults', async () => {
    const service = buildService();
    const result = await service.getSummary(mockWorkspace);

    expect(result.tasks.total).toBe(10);
    expect(result.tasks.todo).toBe(3);
    expect(result.tasks.inProgress).toBe(2);
    expect(result.tasks.done).toBe(4);
    expect(result.issues.total).toBe(5);
    expect(result.goals.total).toBe(3);
    expect(result.habits.total).toBe(4);
    expect(result.transactions.net).toBe(500);
    expect(result.budgets.total).toBe(1);
    expect(result.notifications.unreadCount).toBe(3);
    expect(result.projects.active).toBe(2);
    expect(result.notes.completed).toBe(5);
  });

  it('returns activity with recent items from all modules', async () => {
    const service = buildService();
    const result = await service.getActivity(mockWorkspace, new DashboardQueryDto());

    expect(result.recentTasks.length).toBeGreaterThanOrEqual(0);
    expect(result.recentIssues.length).toBeGreaterThanOrEqual(0);
    expect(result.recentTransactions.length).toBeGreaterThanOrEqual(0);
    expect(result.recentNotes.length).toBeGreaterThanOrEqual(0);
    expect(result.recentJournalEntries.length).toBeGreaterThanOrEqual(0);
    expect(result.recentNotifications.length).toBeGreaterThanOrEqual(0);
  });

  it('returns metrics with completion rates and trends', async () => {
    const service = buildService();
    const result = await service.getMetrics(mockWorkspace, new DashboardQueryDto());

    expect(result.taskCompletionRate).toBe(44);
    expect(result.financialByCategory.length).toBe(1);
    expect(result.habitStreaks.length).toBe(1);
    expect(result.goalProgressBreakdown.length).toBe(1);
    expect(result.projectProgressBreakdown.length).toBe(2);
    expect(result.moodTrend.length).toBe(1);
  });

  it('returns combined overview', async () => {
    const service = buildService();
    const result = await service.getOverview(
      mockWorkspace,
      new DashboardQueryDto(),
    );

    expect(result.summary).toBeDefined();
    expect(result.activity).toBeDefined();
    expect(result.metrics).toBeDefined();
  });

  it('handles zero data gracefully in summary', async () => {
    const service = new DashboardService(
      {
        getTaskOverview: jest.fn().mockResolvedValue({
          totalTasks: 0,
          countsByStatus: { todo: 0, in_progress: 0, done: 0, archived: 0 },
          overdueCount: 0,
          upcomingCount: 0,
        }),
      } as never,
      {
        getIssueOverview: jest.fn().mockResolvedValue({
          total: 0,
          countsByStatus: {
            backlog: 0,
            todo: 0,
            in_progress: 0,
            in_review: 0,
            done: 0,
            canceled: 0,
          },
          overdueCount: 0,
        }),
      } as never,
      {
        getGoalOverview: jest.fn().mockResolvedValue({
          total: 0,
          countsByStatus: { active: 0, completed: 0, archived: 0 },
          avgProgressPercent: 0,
        }),
      } as never,
      {
        getHabitOverview: jest.fn().mockResolvedValue({
          total: 0,
          activeCount: 0,
          archivedCount: 0,
          longestStreak: 0,
          avgStreak: 0,
        }),
      } as never,
      {
        getSummary: jest.fn().mockResolvedValue({
          totalIncome: 0,
          totalExpense: 0,
          netAmount: 0,
          transactionCount: 0,
          byCategory: [],
          byType: [],
        }),
      } as never,
      {
        getBudgetSummary: jest.fn().mockResolvedValue([]),
      } as never,
      {
        getUnreadCount: jest.fn().mockResolvedValue({ count: 0 }),
      } as never,
      {
        getProjectOverview: jest.fn().mockResolvedValue({
          total: 0,
          countsByStatus: {
            backlog: 0,
            planned: 0,
            active: 0,
            completed: 0,
            cancelled: 0,
          },
        }),
      } as never,
      {
        getNoteOverview: jest.fn().mockResolvedValue({
          total: 0,
          countsByStatus: { completed: 0, processing: 0 },
        }),
      } as never,
      {} as never,
    );

    const result = await service.getSummary(mockWorkspace);
    expect(result.tasks.total).toBe(0);
    expect(result.transactions.net).toBe(0);
    expect(result.budgets.avgPercentUsed).toBe(0);
  });
});
