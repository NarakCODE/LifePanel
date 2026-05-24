import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { format } from 'date-fns';
import {
  PerformanceDashboardResponse,
  HealthLabel,
  HealthTone,
  ThroughputPoint,
  WorkMixTrendPoint,
  ProjectHealthRow,
  DeliveryRiskProject,
} from './types/performance.types';
import { PerformanceQueryDto } from './dto/performance-query.dto';
import {
  Project,
  ProjectDocument,
  ProjectStatus,
} from '../projects/schemas/project.schema';
import { Task, TaskDocument, TaskStatus } from '../tasks/schemas/task.schema';

// Helper functions
const MS_DAY = 1000 * 60 * 60 * 24;

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function diffInDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_DAY);
}

// Map task tag to type (for MVP we use tag as a proxy for task type)
function getTaskType(tag?: string): 'bug' | 'improvement' | 'task' {
  if (tag?.toLowerCase().includes('bug')) return 'bug';
  if (tag?.toLowerCase().includes('improvement')) return 'improvement';
  return 'task';
}

// Enriched task type
interface EnrichedTask {
  _id: Types.ObjectId;
  type: 'bug' | 'improvement' | 'task';
  endDate: Date;
  projectId: string;
  projectName: string;
  status: TaskStatus;
  assignee: string;
  startDate?: Date;
}

interface Bucket {
  start: Date;
  end: Date;
  count: number;
}

interface MixBucket {
  start: Date;
  end: Date;
  total: number;
  bug: number;
  improvement: number;
  task: number;
}

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
  ) {}

  async getDashboardData(
    query: PerformanceQueryDto,
  ): Promise<PerformanceDashboardResponse> {
    const { projectId, member, startDate, endDate } = query;

    // Parse date range (default to last 30 days)
    const rangeEnd = endDate ? new Date(`${endDate}T23:59:59`) : new Date();
    const fallbackStart = addDays(rangeEnd, -29);
    const rangeStart = startDate
      ? new Date(`${startDate}T00:00:00`)
      : fallbackStart;

    // Ensure proper ordering
    const effectiveStart =
      rangeStart.getTime() <= rangeEnd.getTime() ? rangeStart : rangeEnd;
    const effectiveEnd =
      rangeStart.getTime() <= rangeEnd.getTime() ? rangeEnd : rangeStart;

    // Build project filter
    const projectFilter: Record<string, any> = {};
    if (projectId && projectId !== 'all') {
      projectFilter._id = new Types.ObjectId(projectId);
    }

    // Fetch projects
    const projects = await this.projectModel.find(projectFilter).lean().exec();
    const projectIds = projects.map((p: ProjectDocument) => p._id.toString());

    // Build task filter
    const taskFilter: Record<string, any> = {
      projectId: { $in: projectIds },
    };

    if (member && member !== 'all') {
      // Member filter - match by assignee name for now
      taskFilter['assignee.name'] = member;
    }

    // Fetch tasks
    const tasks = await this.taskModel.find(taskFilter).lean().exec();

    // Enrich tasks with type and endDate (completedAt or dueDate)
    const enrichedTasks: EnrichedTask[] = tasks.map((task: TaskDocument) => ({
      _id: task._id,
      type: getTaskType(task.tag),
      endDate: task.completedAt || task.dueDate || task.createdAt,
      projectId: task.projectId,
      projectName: task.projectName,
      status: task.status,
      assignee: task.assignee?.name || '',
      startDate: task.startDate,
    }));

    // Calculate range label
    const rangeLabel = `${format(effectiveStart, 'MMM d')} - ${format(effectiveEnd, 'MMM d, yyyy')}`;

    // KPI Calculations
    const doneTasks = enrichedTasks.filter(
      (t: EnrichedTask) => t.status === TaskStatus.DONE,
    );
    const tasksInRange = enrichedTasks.filter(
      (t: EnrichedTask) =>
        (t.startDate?.getTime() || 0) <= effectiveEnd.getTime() &&
        t.endDate.getTime() >= effectiveStart.getTime(),
    );
    const overdueTasks = enrichedTasks.filter(
      (t: EnrichedTask) =>
        t.status !== TaskStatus.DONE &&
        t.endDate.getTime() < effectiveEnd.getTime() &&
        t.endDate.getTime() >= effectiveStart.getTime(),
    );
    const completedInRange = doneTasks.filter(
      (t: EnrichedTask) =>
        t.endDate.getTime() >= effectiveStart.getTime() &&
        t.endDate.getTime() <= effectiveEnd.getTime(),
    );

    // Project Health calculations
    const healthRows = this.calculateProjectHealth(
      projects,
      enrichedTasks,
      effectiveStart,
      effectiveEnd,
    );

    // Active projects for KPI
    const activeProjects = healthRows.filter(
      (row) =>
        row.status === ProjectStatus.ACTIVE ||
        row.status === ProjectStatus.PLANNED,
    );
    const onTrackProjects = activeProjects.filter(
      (row) => row.health.label === 'On track' || row.health.label === 'Ahead',
    );
    const onTrackRate = activeProjects.length
      ? Math.round((onTrackProjects.length / activeProjects.length) * 100)
      : 0;

    // Risk projects
    const riskProjectsAll = healthRows.filter(
      (row) => row.health.label === 'Behind' || row.health.label === 'At risk',
    );
    const deliveryRisks: DeliveryRiskProject[] = riskProjectsAll
      .slice()
      .sort((a, b) => a.variance - b.variance)
      .slice(0, 4)
      .map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status as ProjectStatus,
        taskCount: p.taskCount,
        health: p.health,
        variance: p.variance,
        daysToDue: p.daysToDue,
      }));

    // Time bucketing for charts
    const { throughputBuckets, bugBuckets, mixBuckets } =
      this.createTimeBuckets(effectiveStart, effectiveEnd, completedInRange);

    // Throughput series
    const maxThroughput = Math.max(
      ...throughputBuckets.map((b: Bucket) => b.count),
      1,
    );
    const throughputSeries: ThroughputPoint[] = throughputBuckets.map(
      (bucket: Bucket) => ({
        label: `${format(bucket.start, 'MMM d')} - ${format(bucket.end, 'MMM d')}`,
        count: bucket.count,
        height: Math.round((bucket.count / maxThroughput) * 100),
      }),
    );

    // Bug series
    const maxBugThroughput = Math.max(
      ...bugBuckets.map((b: Bucket) => b.count),
      1,
    );
    const bugSeries: ThroughputPoint[] = bugBuckets.map((bucket: Bucket) => ({
      label: `${format(bucket.start, 'MMM d')} - ${format(bucket.end, 'MMM d')}`,
      count: bucket.count,
      height: Math.round((bucket.count / maxBugThroughput) * 100),
    }));

    // Work mix trend series
    const maxMixTotal = Math.max(
      ...mixBuckets.map((b: MixBucket) => b.total),
      1,
    );
    const mixTrendSeries: WorkMixTrendPoint[] = mixBuckets.map(
      (bucket: MixBucket) => ({
        label: `${format(bucket.start, 'MMM d')} - ${format(bucket.end, 'MMM d')}`,
        total: bucket.total,
        bug: bucket.bug,
        improvement: bucket.improvement,
        task: bucket.task,
        height: Math.round((bucket.total / maxMixTotal) * 100),
      }),
    );

    // Work mix distribution
    const workMix = tasksInRange.reduce(
      (
        acc: { bug: number; improvement: number; task: number },
        task: EnrichedTask,
      ) => {
        acc[task.type] += 1;
        return acc;
      },
      { bug: 0, improvement: 0, task: 0 },
    );
    const workMixTotal = tasksInRange.length;

    // Bug clearance
    const completedBugsInRange = completedInRange.filter(
      (t: EnrichedTask) => t.type === 'bug',
    );
    const openBugs = tasksInRange.filter(
      (t: EnrichedTask) => t.type === 'bug' && t.status !== TaskStatus.DONE,
    );
    const bugTotal = completedBugsInRange.length + openBugs.length;
    const bugClearanceRate = bugTotal
      ? Math.round((completedBugsInRange.length / bugTotal) * 100)
      : 0;

    return {
      rangeLabel,
      filteredProjectCount: projects.length,
      totalTasksInRange: tasksInRange.length,
      kpis: {
        onTrackProjects: {
          value: `${onTrackProjects.length}/${activeProjects.length}`,
          description: `${onTrackRate}% on schedule across active work`,
          tone:
            onTrackRate >= 70
              ? 'positive'
              : onTrackRate >= 50
                ? 'warning'
                : 'danger',
        },
        overdueTasks: {
          value: String(overdueTasks.length),
          description: 'Tasks past their planned end date',
          tone:
            overdueTasks.length > 6
              ? 'danger'
              : overdueTasks.length > 2
                ? 'warning'
                : 'neutral',
        },
        completedInRange: {
          value: String(completedInRange.length),
          description: rangeLabel,
          tone: completedInRange.length > 10 ? 'positive' : 'neutral',
        },
        projectsAtRisk: {
          value: String(riskProjectsAll.length),
          description: 'Projects behind or at risk vs schedule',
          tone:
            riskProjectsAll.length > 3
              ? 'danger'
              : riskProjectsAll.length > 1
                ? 'warning'
                : 'neutral',
        },
      },
      throughput: {
        total: throughputSeries.reduce(
          (acc: number, item: ThroughputPoint) => acc + item.count,
          0,
        ),
        series: throughputSeries,
      },
      workMix: {
        total: workMixTotal,
        distribution: workMix,
        percentages: {
          bug: workMixTotal ? (workMix.bug / workMixTotal) * 100 : 0,
          improvement: workMixTotal
            ? (workMix.improvement / workMixTotal) * 100
            : 0,
          task: workMixTotal ? (workMix.task / workMixTotal) * 100 : 0,
        },
      },
      bugClearance: {
        open: openBugs.length,
        completed: completedBugsInRange.length,
        clearanceRate: bugClearanceRate,
        series: bugSeries,
      },
      deliveryRisks,
      workMixTrend: {
        total: mixTrendSeries.reduce(
          (acc: number, item: WorkMixTrendPoint) => acc + item.total,
          0,
        ),
        series: mixTrendSeries,
      },
      projectHealth: healthRows,
    };
  }

  private calculateProjectHealth(
    projects: (ProjectDocument & { createdAt?: Date })[],
    tasks: EnrichedTask[],
    rangeStart: Date,
    rangeEnd: Date,
  ): ProjectHealthRow[] {
    return projects.map((project) => {
      // Calculate project progress based on tasks
      const projectTasks = tasks.filter(
        (t: EnrichedTask) => t.projectId === project._id.toString(),
      );
      const totalTasks = projectTasks.length || 1;
      const completedTasks = projectTasks.filter(
        (t: EnrichedTask) => t.status === TaskStatus.DONE,
      ).length;
      const progress = Math.round((completedTasks / totalTasks) * 100);

      // Calculate schedule progress (mock based on createdAt/updatedAt since we don't have project dates)
      const projectStart = project.createdAt || new Date();
      const projectEnd = addDays(projectStart, 30); // Mock 30 day duration
      const duration = projectEnd.getTime() - projectStart.getTime();
      const elapsed = rangeEnd.getTime() - projectStart.getTime();
      const scheduleProgress =
        duration > 0
          ? Math.min(100, Math.max(0, (elapsed / duration) * 100))
          : 0;
      const variance = Math.round(progress - scheduleProgress);
      const daysToDue = diffInDays(rangeEnd, projectEnd);
      const health = this.getHealthLabel(project.status, variance);

      return {
        id: project._id.toString(),
        name: project.name,
        status: project.status,
        progress,
        schedule: Math.round(scheduleProgress),
        variance,
        daysToDue,
        taskCount: projectTasks.length,
        endDate: projectEnd.toISOString(),
        health,
      };
    });
  }

  private getHealthLabel(
    status: ProjectStatus,
    variance: number,
  ): { label: HealthLabel; tone: HealthTone } {
    if (status === ProjectStatus.COMPLETED)
      return { label: 'Completed', tone: 'positive' };
    if (status === ProjectStatus.CANCELLED)
      return { label: 'Cancelled', tone: 'muted' };
    if (variance >= 8) return { label: 'Ahead', tone: 'positive' };
    if (variance <= -12) return { label: 'Behind', tone: 'danger' };
    if (variance <= -4) return { label: 'At risk', tone: 'warning' };
    return { label: 'On track', tone: 'neutral' };
  }

  private createTimeBuckets(
    rangeStart: Date,
    rangeEnd: Date,
    completedTasks: EnrichedTask[],
  ) {
    const totalDays = Math.max(1, diffInDays(rangeStart, rangeEnd) + 1);
    const bucketCount = Math.min(6, totalDays);
    const baseBucketSize = Math.floor(totalDays / bucketCount);
    const remainder = totalDays % bucketCount;

    let bucketOffset = 0;
    const throughputBuckets: Bucket[] = Array.from(
      { length: bucketCount },
      (_, index) => {
        const size = baseBucketSize + (index < remainder ? 1 : 0);
        const start = addDays(rangeStart, bucketOffset);
        const end = addDays(rangeStart, bucketOffset + size - 1);
        bucketOffset += size;
        return { start, end, count: 0 };
      },
    );

    const bucketEnds = throughputBuckets.map((bucket: Bucket) =>
      diffInDays(rangeStart, bucket.end),
    );

    const bugBuckets: Bucket[] = throughputBuckets.map((bucket: Bucket) => ({
      ...bucket,
    }));
    const mixBuckets: MixBucket[] = throughputBuckets.map((bucket: Bucket) => ({
      ...bucket,
      total: 0,
      bug: 0,
      improvement: 0,
      task: 0,
    }));

    const completedBugs = completedTasks.filter(
      (t: EnrichedTask) => t.type === 'bug',
    );

    // Fill throughput and mix buckets
    completedTasks.forEach((task: EnrichedTask) => {
      const offset = diffInDays(rangeStart, task.endDate);
      if (offset < 0 || offset >= totalDays) return;
      const bucketMatch = bucketEnds.findIndex((end: number) => offset <= end);
      const bucketIndex = bucketMatch === -1 ? bucketCount - 1 : bucketMatch;
      const bucket = throughputBuckets[bucketIndex];
      if (bucket) {
        bucket.count += 1;
        const mixBucket = mixBuckets[bucketIndex];
        if (mixBucket) {
          mixBucket.total += 1;
          mixBucket[task.type] += 1;
        }
      }
    });

    // Fill bug buckets
    completedBugs.forEach((task: EnrichedTask) => {
      const offset = diffInDays(rangeStart, task.endDate);
      if (offset < 0 || offset >= totalDays) return;
      const bucketMatch = bucketEnds.findIndex((end: number) => offset <= end);
      const bucketIndex = bucketMatch === -1 ? bucketCount - 1 : bucketMatch;
      const bugBucket = bugBuckets[bucketIndex];
      if (bugBucket) {
        bugBucket.count += 1;
      }
    });

    return { throughputBuckets, bugBuckets, mixBuckets };
  }
}
