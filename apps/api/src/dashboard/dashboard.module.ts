import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TasksModule } from '../tasks/tasks.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { IssuesModule } from '../issues/issues.module';
import { GoalsModule } from '../goals/goals.module';
import { HabitsModule } from '../habits/habits.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectsModule } from '../projects/projects.module';
import { NotesModule } from '../notes/notes.module';
import { JournalEntriesModule } from '../journal-entries/journal-entries.module';

@Module({
  imports: [
    TasksModule,
    WorkspacesModule,
    IssuesModule,
    GoalsModule,
    HabitsModule,
    TransactionsModule,
    BudgetsModule,
    NotificationsModule,
    ProjectsModule,
    NotesModule,
    JournalEntriesModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
