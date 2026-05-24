import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { PerformanceFiltersResponse } from './types/filters.types';

@Injectable()
export class FiltersService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
  ) {}

  async getPerformanceFilters(): Promise<PerformanceFiltersResponse> {
    // Fetch all projects
    const projects = await this.projectModel
      .find()
      .select('name')
      .lean()
      .exec();

    // Extract unique assignees from tasks
    const tasks = await this.taskModel
      .find({ assignee: { $exists: true, $ne: null } })
      .select('assignee')
      .lean()
      .exec();

    const memberSet = new Set<string>();
    tasks.forEach((task: TaskDocument) => {
      if (task.assignee?.name) {
        memberSet.add(task.assignee.name);
      }
    });

    return {
      projects: projects.map((p: ProjectDocument & { name: string }) => ({
        id: p._id.toString(),
        name: p.name,
      })),
      members: Array.from(memberSet)
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({
          id: name,
          name,
        })),
    };
  }
}
