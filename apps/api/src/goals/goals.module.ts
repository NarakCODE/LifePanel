import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Goal, GoalSchema } from './schemas/goal.schema';
import { TasksModule } from '../tasks/tasks.module';
import { HabitsModule } from '../habits/habits.module';
import { GoalsRepository } from './goals.repository';
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';
import { GoalEventsListener } from './listeners/goal-events.listener';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [
    WorkspacesModule,
    MongooseModule.forFeature([{ name: Goal.name, schema: GoalSchema }]),
    TasksModule,
    HabitsModule,
  ],
  controllers: [GoalsController],
  providers: [GoalsRepository, GoalsService, GoalEventsListener],
  exports: [GoalsService, GoalsRepository],
})
export class GoalsModule {}
