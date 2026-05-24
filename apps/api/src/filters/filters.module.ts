import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FiltersController } from './filters.controller';
import { FiltersService } from './filters.service';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
  ],
  controllers: [FiltersController],
  providers: [FiltersService],
  exports: [FiltersService],
})
export class FiltersModule {}
