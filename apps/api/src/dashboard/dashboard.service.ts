import { Injectable, Logger } from '@nestjs/common';
import { TasksService } from '../tasks/tasks.service';
import { IssuesService } from '../issues/issues.service';
import { GoalsService } from '../goals/goals.service';
import { HabitsService } from '../habits/habits.service';
import { TransactionsService } from '../transactions/transactions.service';
import { BudgetsService } from '../budgets/budgets.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectsService } from '../projects/projects.service';
import { NotesService } from '../notes/notes.service';
import { JournalEntriesService } from '../journal-entries/journal-entries.service';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { DashboardSummaryResponseDto } from './dto/dashboard-summary-response.dto';
import { DashboardActivityResponseDto } from './dto/dashboard-activity-response.dto';
import { DashboardMetricsResponseDto } from './dto/dashboard-metrics-response.dto';
import { DashboardOverviewResponseDto } from './dto/dashboard-overview-response.dto';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { QueryTaskDto } from '../tasks/dto/query-task.dto';
import { QueryIssueDto } from '../issues/dto/query-issue.dto';
import { QueryTransactionDto } from '../transactions/dto/query-transaction.dto';
import { QueryNoteDto } from '../notes/dto/query-note.dto';
import { QueryJournalEntryDto } from '../journal-entries/dto/query-journal-entry.dto';
import { QueryNotificationDto } from '../notifications/dto/query-notification.dto';
import { QueryGoalDto } from '../goals/dto/query-goal.dto';
import { QueryHabitDto } from '../habits/dto/query-habit.dto';
import { QueryBudgetDto } from '../budgets/dto/query-budget.dto';
import { MoodSummaryQueryDto } from '../journal-entries/dto/mood-summary.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly tasksService: TasksService,
    private readonly issuesService: IssuesService,
    private readonly goalsService: GoalsService,
    private readonly habitsService: HabitsService,
    private readonly transactionsService: TransactionsService,
    private readonly budgetsService: BudgetsService,
    private readonly notificationsService: NotificationsService,
    private readonly projectsService: ProjectsService,
    private readonly notesService: NotesService,
    private readonly journalEntriesService: JournalEntriesService,
  ) {}

  async getSummary(
    workspace: WorkspaceRequestContext,
  ): Promise<DashboardSummaryResponseDto> {
    const [
      taskOverview,
      issueOverview,
      goalOverview,
      habitOverview,
      transactionSummary,
      budgetSummary,
      unreadCount,
      projectOverview,
      noteOverview,
    ] = await Promise.all([
      this.tasksService.getTaskOverview(workspace),
      this.issuesService.getIssueOverview(workspace),
      this.goalsService.getGoalOverview(workspace),
      this.habitsService.getHabitOverview(workspace),
      this.transactionsService.getSummary(workspace, new QueryTransactionDto()),
      this.budgetsService.getBudgetSummary(workspace, new QueryBudgetDto()),
      this.notificationsService.getUnreadCount(workspace),
      this.projectsService.getProjectOverview(workspace),
      this.notesService.getNoteOverview(workspace),
    ]);

    const safeBudgetPercent =
      budgetSummary.length > 0
        ? Math.round(
            budgetSummary.reduce((sum, b) => sum + (b.percentUsed ?? 0), 0) /
              budgetSummary.length,
          )
        : 0;

    return new DashboardSummaryResponseDto({
      tasks: {
        total: taskOverview.totalTasks ?? 0,
        todo: taskOverview.countsByStatus?.todo ?? 0,
        inProgress: taskOverview.countsByStatus?.in_progress ?? 0,
        done: taskOverview.countsByStatus?.done ?? 0,
        archived: taskOverview.countsByStatus?.archived ?? 0,
        overdue: taskOverview.overdueCount ?? 0,
        upcoming: taskOverview.upcomingCount ?? 0,
      },
      issues: {
        total: issueOverview.total ?? 0,
        backlog: issueOverview.countsByStatus?.backlog ?? 0,
        todo: issueOverview.countsByStatus?.todo ?? 0,
        inProgress: issueOverview.countsByStatus?.in_progress ?? 0,
        inReview: issueOverview.countsByStatus?.in_review ?? 0,
        done: issueOverview.countsByStatus?.done ?? 0,
        canceled: issueOverview.countsByStatus?.canceled ?? 0,
        overdue: issueOverview.overdueCount ?? 0,
      },
      goals: {
        total: goalOverview.total ?? 0,
        active: goalOverview.countsByStatus?.active ?? 0,
        completed: goalOverview.countsByStatus?.completed ?? 0,
        archived: goalOverview.countsByStatus?.archived ?? 0,
        avgProgressPercent: goalOverview.avgProgressPercent ?? 0,
      },
      habits: {
        total: habitOverview.total ?? 0,
        active: habitOverview.activeCount ?? 0,
        archived: habitOverview.archivedCount ?? 0,
        longestStreak: habitOverview.longestStreak ?? 0,
        avgStreak: habitOverview.avgStreak ?? 0,
      },
      transactions: {
        totalIncome: transactionSummary.totalIncome ?? 0,
        totalExpense: transactionSummary.totalExpense ?? 0,
        net: transactionSummary.netAmount ?? 0,
        count: transactionSummary.transactionCount ?? 0,
      },
      budgets: {
        total: budgetSummary.length ?? 0,
        overBudgetCount:
          budgetSummary.filter((b) => b.isOverBudget).length ?? 0,
        avgPercentUsed: safeBudgetPercent,
      },
      notifications: {
        unreadCount: unreadCount.count ?? 0,
      },
      projects: {
        total: projectOverview.total ?? 0,
        backlog: projectOverview.countsByStatus?.backlog ?? 0,
        planned: projectOverview.countsByStatus?.planned ?? 0,
        active: projectOverview.countsByStatus?.active ?? 0,
        completed: projectOverview.countsByStatus?.completed ?? 0,
        cancelled: projectOverview.countsByStatus?.cancelled ?? 0,
      },
      notes: {
        total: noteOverview.total ?? 0,
        completed: noteOverview.countsByStatus?.completed ?? 0,
        processing: noteOverview.countsByStatus?.processing ?? 0,
      },
    });
  }

  async getActivity(
    workspace: WorkspaceRequestContext,
    query: DashboardQueryDto,
  ): Promise<DashboardActivityResponseDto> {
    const taskQuery = new QueryTaskDto();
    taskQuery.limit = 5;
    taskQuery.page = 1;

    const issueQuery = new QueryIssueDto();
    issueQuery.limit = 5;
    issueQuery.page = 1;

    const transactionQuery = new QueryTransactionDto();
    transactionQuery.limit = 5;
    transactionQuery.page = 1;

    const noteQuery = new QueryNoteDto();
    noteQuery.limit = 5;
    noteQuery.page = 1;

    const journalQuery = new QueryJournalEntryDto();
    journalQuery.limit = 5;
    journalQuery.page = 1;

    const notificationQuery = new QueryNotificationDto();
    notificationQuery.limit = 5;
    notificationQuery.page = 1;

    if (query.dateFrom) {
      const fromDate = new Date(query.dateFrom);
      taskQuery.startDateFrom = fromDate;
      transactionQuery.dateFrom = fromDate;
      journalQuery.dateFrom = fromDate;
    }

    if (query.dateTo) {
      const toDate = new Date(query.dateTo);
      taskQuery.startDateTo = toDate;
      transactionQuery.dateTo = toDate;
      journalQuery.dateTo = toDate;
    }

    const [
      tasksResult,
      issuesResult,
      transactionsResult,
      notesResult,
      journalResult,
      notificationsResult,
    ] = await Promise.all([
      this.tasksService.findMany(workspace, taskQuery),
      this.issuesService.findMany(workspace, issueQuery),
      this.transactionsService.findMany(workspace, transactionQuery),
      this.notesService.findMany(workspace, noteQuery),
      this.journalEntriesService.findMany(workspace, journalQuery),
      this.notificationsService.findMany(workspace, notificationQuery),
    ]);

    return new DashboardActivityResponseDto({
      recentTasks: tasksResult.data?.tasks ?? [],
      recentIssues: issuesResult.data?.issues ?? [],
      recentTransactions: transactionsResult.items ?? [],
      recentNotes: notesResult.notes ?? [],
      recentJournalEntries: journalResult.items ?? [],
      recentNotifications: notificationsResult.data ?? [],
    });
  }

  async getMetrics(
    workspace: WorkspaceRequestContext,
    query: DashboardQueryDto,
  ): Promise<DashboardMetricsResponseDto> {
    const taskOverview = await this.tasksService.getTaskOverview(workspace);
    const transactionSummary = await this.transactionsService.getSummary(
      workspace,
      new QueryTransactionDto(),
    );

    const habitQuery = new QueryHabitDto();
    habitQuery.limit = 5;
    habitQuery.page = 1;

    const goalQuery = new QueryGoalDto();
    goalQuery.limit = 5;
    goalQuery.page = 1;

    const moodQuery = new MoodSummaryQueryDto();
    if (query.dateFrom) moodQuery.dateFrom = new Date(query.dateFrom);
    if (query.dateTo) moodQuery.dateTo = new Date(query.dateTo);

    const [
      habitsResult,
      goalsResult,
      moodSummary,
      projects,
      allTasksForProjects,
    ] = await Promise.all([
      this.habitsService.findMany(workspace, habitQuery),
      this.goalsService.findMany(workspace, goalQuery),
      this.journalEntriesService.getMoodSummary(workspace, moodQuery),
      this.projectsService.findAllAccessible(workspace),
      this.tasksService.findMany(workspace, {
        limit: 1000,
        page: 1,
      } as QueryTaskDto),
    ]);

    const activeTasks =
      (taskOverview.totalTasks ?? 0) -
      (taskOverview.countsByStatus?.archived ?? 0);
    const taskCompletionRate =
      activeTasks > 0
        ? Math.round(
            ((taskOverview.countsByStatus?.done ?? 0) / activeTasks) * 100,
          )
        : 0;

    const habitStreaks = (habitsResult.items ?? []).map((h) => ({
      habitId: h.id,
      name: h.name,
      currentStreak: h.currentStreak ?? 0,
      longestStreak: h.longestStreak ?? 0,
    }));

    const goalProgressBreakdown = (goalsResult.items ?? []).map((g) => ({
      goalId: g.id,
      title: g.title,
      progressPercent: g.progressPercent ?? 0,
      status: g.status,
    }));

    // Build project progress from all workspace tasks grouped by project
    const tasksByProject = new Map<string, { total: number; done: number }>();
    for (const task of allTasksForProjects.data?.tasks ?? []) {
      const pid = task.projectId ?? 'personal';
      const entry = tasksByProject.get(pid) ?? { total: 0, done: 0 };
      entry.total += 1;
      if (task.status === 'done') {
        entry.done += 1;
      }
      tasksByProject.set(pid, entry);
    }

    const projectProgressBreakdown = projects.map((p) => {
      const stats = tasksByProject.get(p.id) ?? { total: 0, done: 0 };
      return {
        projectId: p.id,
        name: p.name,
        taskCount: stats.total,
        completedTaskCount: stats.done,
        progressPercent:
          stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0,
      };
    });

    return new DashboardMetricsResponseDto({
      taskCompletionRate,
      financialByCategory: transactionSummary.byCategory ?? [],
      habitStreaks,
      goalProgressBreakdown,
      projectProgressBreakdown,
      moodTrend: moodSummary.trend ?? [],
    });
  }

  async getOverview(
    workspace: WorkspaceRequestContext,
    query: DashboardQueryDto,
  ): Promise<DashboardOverviewResponseDto> {
    const [summary, activity, metrics] = await Promise.all([
      this.getSummary(workspace),
      this.getActivity(workspace, query),
      this.getMetrics(workspace, query),
    ]);

    return new DashboardOverviewResponseDto({
      summary,
      activity,
      metrics,
    });
  }
}
