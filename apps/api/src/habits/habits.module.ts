import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Habit, HabitSchema } from './schemas/habit.schema';
import { HabitsRepository } from './habits.repository';
import { HabitsService } from './habits.service';
import { HabitsController } from './habits.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [
    WorkspacesModule,
    MongooseModule.forFeature([{ name: Habit.name, schema: HabitSchema }]),
  ],
  controllers: [HabitsController],
  providers: [HabitsRepository, HabitsService],
  exports: [HabitsService, HabitsRepository],
})
export class HabitsModule {}
