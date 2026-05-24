import { ApiProperty } from '@nestjs/swagger';

class TaskSummaryDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  todo!: number;

  @ApiProperty()
  inProgress!: number;

  @ApiProperty()
  done!: number;

  @ApiProperty()
  archived!: number;

  @ApiProperty()
  overdue!: number;

  @ApiProperty()
  upcoming!: number;

  constructor(partial: Partial<TaskSummaryDto>) {
    Object.assign(this, partial);
  }
}

class IssueSummaryDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  backlog!: number;

  @ApiProperty()
  todo!: number;

  @ApiProperty()
  inProgress!: number;

  @ApiProperty()
  inReview!: number;

  @ApiProperty()
  done!: number;

  @ApiProperty()
  canceled!: number;

  @ApiProperty()
  overdue!: number;

  constructor(partial: Partial<IssueSummaryDto>) {
    Object.assign(this, partial);
  }
}

class GoalSummaryDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  active!: number;

  @ApiProperty()
  completed!: number;

  @ApiProperty()
  archived!: number;

  @ApiProperty()
  avgProgressPercent!: number;

  constructor(partial: Partial<GoalSummaryDto>) {
    Object.assign(this, partial);
  }
}

class HabitSummaryDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  active!: number;

  @ApiProperty()
  archived!: number;

  @ApiProperty()
  longestStreak!: number;

  @ApiProperty()
  avgStreak!: number;

  constructor(partial: Partial<HabitSummaryDto>) {
    Object.assign(this, partial);
  }
}

class TransactionSummaryDto {
  @ApiProperty()
  totalIncome!: number;

  @ApiProperty()
  totalExpense!: number;

  @ApiProperty()
  net!: number;

  @ApiProperty()
  count!: number;

  constructor(partial: Partial<TransactionSummaryDto>) {
    Object.assign(this, partial);
  }
}

class BudgetSummaryDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  overBudgetCount!: number;

  @ApiProperty()
  avgPercentUsed!: number;

  constructor(partial: Partial<BudgetSummaryDto>) {
    Object.assign(this, partial);
  }
}

class NotificationSummaryDto {
  @ApiProperty()
  unreadCount!: number;

  constructor(partial: Partial<NotificationSummaryDto>) {
    Object.assign(this, partial);
  }
}

class ProjectSummaryDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  backlog!: number;

  @ApiProperty()
  planned!: number;

  @ApiProperty()
  active!: number;

  @ApiProperty()
  completed!: number;

  @ApiProperty()
  cancelled!: number;

  constructor(partial: Partial<ProjectSummaryDto>) {
    Object.assign(this, partial);
  }
}

class NoteSummaryDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  completed!: number;

  @ApiProperty()
  processing!: number;

  constructor(partial: Partial<NoteSummaryDto>) {
    Object.assign(this, partial);
  }
}

export class DashboardSummaryResponseDto {
  @ApiProperty({ type: TaskSummaryDto })
  tasks!: TaskSummaryDto;

  @ApiProperty({ type: IssueSummaryDto })
  issues!: IssueSummaryDto;

  @ApiProperty({ type: GoalSummaryDto })
  goals!: GoalSummaryDto;

  @ApiProperty({ type: HabitSummaryDto })
  habits!: HabitSummaryDto;

  @ApiProperty({ type: TransactionSummaryDto })
  transactions!: TransactionSummaryDto;

  @ApiProperty({ type: BudgetSummaryDto })
  budgets!: BudgetSummaryDto;

  @ApiProperty({ type: NotificationSummaryDto })
  notifications!: NotificationSummaryDto;

  @ApiProperty({ type: ProjectSummaryDto })
  projects!: ProjectSummaryDto;

  @ApiProperty({ type: NoteSummaryDto })
  notes!: NoteSummaryDto;

  constructor(partial: Partial<DashboardSummaryResponseDto>) {
    this.tasks = new TaskSummaryDto(partial.tasks ?? {});
    this.issues = new IssueSummaryDto(partial.issues ?? {});
    this.goals = new GoalSummaryDto(partial.goals ?? {});
    this.habits = new HabitSummaryDto(partial.habits ?? {});
    this.transactions = new TransactionSummaryDto(partial.transactions ?? {});
    this.budgets = new BudgetSummaryDto(partial.budgets ?? {});
    this.notifications = new NotificationSummaryDto(
      partial.notifications ?? {},
    );
    this.projects = new ProjectSummaryDto(partial.projects ?? {});
    this.notes = new NoteSummaryDto(partial.notes ?? {});
  }
}
