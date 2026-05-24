import { ApiProperty } from '@nestjs/swagger';

class CategoryMetricDto {
  @ApiProperty()
  category!: string;

  @ApiProperty()
  totalAmount!: number;

  @ApiProperty()
  count!: number;

  constructor(partial: Partial<CategoryMetricDto>) {
    Object.assign(this, partial);
  }
}

class HabitStreakMetricDto {
  @ApiProperty()
  habitId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  currentStreak!: number;

  @ApiProperty()
  longestStreak!: number;

  constructor(partial: Partial<HabitStreakMetricDto>) {
    Object.assign(this, partial);
  }
}

class GoalProgressMetricDto {
  @ApiProperty()
  goalId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  progressPercent!: number;

  @ApiProperty()
  status!: string;

  constructor(partial: Partial<GoalProgressMetricDto>) {
    Object.assign(this, partial);
  }
}

class ProjectProgressMetricDto {
  @ApiProperty()
  projectId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  taskCount!: number;

  @ApiProperty()
  completedTaskCount!: number;

  @ApiProperty()
  progressPercent!: number;

  constructor(partial: Partial<ProjectProgressMetricDto>) {
    Object.assign(this, partial);
  }
}

class MoodTrendMetricDto {
  @ApiProperty()
  date!: string;

  @ApiProperty()
  avgMood!: number;

  @ApiProperty()
  entryCount!: number;

  constructor(partial: Partial<MoodTrendMetricDto>) {
    Object.assign(this, partial);
  }
}

export class DashboardMetricsResponseDto {
  @ApiProperty()
  taskCompletionRate!: number;

  @ApiProperty({ type: [CategoryMetricDto] })
  financialByCategory!: CategoryMetricDto[];

  @ApiProperty({ type: [HabitStreakMetricDto] })
  habitStreaks!: HabitStreakMetricDto[];

  @ApiProperty({ type: [GoalProgressMetricDto] })
  goalProgressBreakdown!: GoalProgressMetricDto[];

  @ApiProperty({ type: [ProjectProgressMetricDto] })
  projectProgressBreakdown!: ProjectProgressMetricDto[];

  @ApiProperty({ type: [MoodTrendMetricDto] })
  moodTrend!: MoodTrendMetricDto[];

  constructor(partial: Partial<DashboardMetricsResponseDto>) {
    this.taskCompletionRate = partial.taskCompletionRate ?? 0;
    this.financialByCategory =
      partial.financialByCategory?.map((c) => new CategoryMetricDto(c)) ?? [];
    this.habitStreaks =
      partial.habitStreaks?.map((h) => new HabitStreakMetricDto(h)) ?? [];
    this.goalProgressBreakdown =
      partial.goalProgressBreakdown?.map((g) => new GoalProgressMetricDto(g)) ??
      [];
    this.projectProgressBreakdown =
      partial.projectProgressBreakdown?.map(
        (p) => new ProjectProgressMetricDto(p),
      ) ?? [];
    this.moodTrend =
      partial.moodTrend?.map((m) => new MoodTrendMetricDto(m)) ?? [];
  }
}
