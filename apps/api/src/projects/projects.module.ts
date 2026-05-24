import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './schemas/project.schema';
import { ProjectsRepository } from './projects.repository';
import { ProjectsMapper } from './projects.mapper';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { UsersModule } from '../users/users.module';
import { TasksModule } from '../tasks/tasks.module';
import { ProjectSeeder } from './seeds/project-seeder';

/**
 * ProjectsModule — feature-scoped module (arch-feature-modules).
 *
 * Infrastructure globals (Redis, AuditService, EventEmitter2) are injected via
 * the global RedisModule and AuditModule, both registered in AppModule, so they
 * do not need to be listed here again (arch-module-sharing / arch-avoid-circular-deps).
 */
@Module({
  imports: [
    WorkspacesModule,
    UsersModule,
    forwardRef(() => TasksModule), // forwardRef resolves the mutual project↔task dependency
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
  ],
  controllers: [ProjectsController],
  providers: [
    ProjectsRepository,
    ProjectsMapper,   // (arch-single-responsibility) stateless DTO mapping
    ProjectsService,
    ProjectSeeder,
  ],
  exports: [ProjectsRepository, ProjectsMapper, ProjectsService, ProjectSeeder],
})
export class ProjectsModule {}
