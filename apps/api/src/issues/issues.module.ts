import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { IssuesController } from './issues.controller';
import { IssuesRepository } from './issues.repository';
import { IssuesService } from './issues.service';
import { IssueSeeder } from './seeds/issue-seeder';
import {
  IssueSequence,
  IssueSequenceSchema,
} from './schemas/issue-sequence.schema';
import { Issue, IssueSchema } from './schemas/issue.schema';

@Module({
  imports: [
    UsersModule,
    ProjectsModule,
    WorkspacesModule,
    MongooseModule.forFeature([
      { name: Issue.name, schema: IssueSchema },
      { name: IssueSequence.name, schema: IssueSequenceSchema },
    ]),
  ],
  controllers: [IssuesController],
  providers: [IssuesRepository, IssuesService, IssueSeeder],
  exports: [IssuesRepository, IssuesService, IssueSeeder],
})
export class IssuesModule {}
