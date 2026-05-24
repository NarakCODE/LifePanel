import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from './schemas/task.schema';
import {
  CustomStatus,
  CustomStatusSchema,
} from './schemas/custom-status.schema';
import { TimeLog, TimeLogSchema } from './schemas/time-log.schema';
import {
  RecurringRule,
  RecurringRuleSchema,
} from './schemas/recurring-rule.schema';
import { TasksRepository } from './tasks.repository';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { UsersModule } from '../users/users.module';
import { ProjectsModule } from '../projects/projects.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => ProjectsModule),
    WorkspacesModule,
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: CustomStatus.name, schema: CustomStatusSchema },
      { name: TimeLog.name, schema: TimeLogSchema },
      { name: RecurringRule.name, schema: RecurringRuleSchema },
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksRepository, TasksService],
  exports: [TasksService, TasksRepository],
})
export class TasksModule {}
