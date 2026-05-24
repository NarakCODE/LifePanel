import { Types } from 'mongoose';
import { ProjectsService } from './projects.service';
import { ProjectsMapper } from './projects.mapper';
import { ProjectPriority, ProjectStatus } from './schemas/project.schema';
import { TaskPriority, TaskStatus } from '../tasks/schemas/task.schema';

/** Shared no-op stubs for the new infra dependencies */
const noopEvents = { emit: jest.fn() } as never;
const noopCache = {
  getOrSet: jest.fn((_, __, ___, fallback: () => Promise<unknown>) => fallback()),
  delete: jest.fn().mockResolvedValue(0),
  deleteByPattern: jest.fn().mockResolvedValue(0),
} as never;
const noopAudit = { log: jest.fn() } as never;

describe('ProjectsService', () => {
  it('builds a real project details payload from project and task data', async () => {
    const workspaceId = new Types.ObjectId();
    const ownerUserId = new Types.ObjectId();
    const memberUserId = new Types.ObjectId();
    const projectId = new Types.ObjectId();
    const workstreamId = new Types.ObjectId();
    const taskId = new Types.ObjectId();
    const now = new Date('2026-03-24T00:00:00.000Z');

    const projectsRepo = {
      findAccessibleById: jest.fn().mockResolvedValue({
        id: projectId.toString(),
        name: 'Project Phoenix',
        workstreams: [
          {
            _id: workstreamId,
            name: 'Backend',
            order: 0,
            archivedAt: null,
          },
        ],
        toObject: () => ({
          _id: projectId,
          workspaceId,
          ownerUserId,
          memberUserIds: [memberUserId],
          name: 'Project Phoenix',
          status: ProjectStatus.ACTIVE,
          priority: ProjectPriority.HIGH,
          typeLabel: 'Sprint',
          durationLabel: '2 weeks',
          workstreams: [
            {
              _id: workstreamId,
              name: 'Backend',
              order: 0,
              archivedAt: null,
            },
          ],
          createdAt: now,
          updatedAt: now,
        }),
      }),
    };
    const tasksRepo = {
      findByProject: jest.fn().mockResolvedValue([
        {
          id: taskId.toString(),
          name: 'Build aggregate endpoint',
          status: TaskStatus.IN_PROGRESS,
          projectId: projectId.toString(),
          projectName: 'Project Phoenix',
          workstreamId: workstreamId.toString(),
          workstreamName: 'Backend',
          assignee: {
            id: memberUserId,
            name: 'Support Engineer',
          },
          startDate: new Date('2026-03-23T00:00:00.000Z'),
          dueDate: new Date('2026-03-28T00:00:00.000Z'),
          priority: TaskPriority.HIGH,
          tag: 'API',
          description: 'Ship the project details aggregator',
          projectOrder: 0,
          workstreamOrder: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]),
    };
    const usersService = {
      findByIds: jest.fn().mockResolvedValue([
        {
          _id: ownerUserId,
          displayName: 'Owner User',
        },
        {
          _id: memberUserId,
          displayName: 'Support Engineer',
        },
      ]),
      findById: jest.fn(),
    };

    const mapper = new ProjectsMapper();
    const service = new ProjectsService(
      projectsRepo as never,
      tasksRepo as never,
      usersService as never,
      mapper,
      noopEvents,
      noopCache,
      noopAudit,
    );

    await expect(
      service.getDetails(projectId.toString(), {
        workspaceId: workspaceId.toString(),
        actorUserId: ownerUserId.toString(),
      } as never),
    ).resolves.toEqual(
      expect.objectContaining({
        id: projectId.toString(),
        workspaceId: workspaceId.toString(),
        name: 'Project Phoenix',
        workstreams: [
          expect.objectContaining({
            id: workstreamId.toString(),
            name: 'Backend',
            tasks: [
              expect.objectContaining({
                id: taskId.toString(),
                name: 'Build aggregate endpoint',
                status: TaskStatus.IN_PROGRESS,
              }),
            ],
          }),
        ],
        projectTasks: [
          expect.objectContaining({
            id: taskId.toString(),
            workstreamId: workstreamId.toString(),
            workstreamName: 'Backend',
          }),
        ],
        timelineTasks: [
          expect.objectContaining({
            id: taskId.toString(),
            status: 'in-progress',
          }),
        ],
        backlog: expect.objectContaining({
          statusLabel: 'Active',
          priorityLabel: 'High',
        }),
      }),
    );
  });

  it('rejects partial workstream reorder payloads', async () => {
    const workspaceId = new Types.ObjectId();
    const ownerUserId = new Types.ObjectId();
    const projectId = new Types.ObjectId();
    const workstreamId = new Types.ObjectId();
    const taskAId = new Types.ObjectId();
    const taskBId = new Types.ObjectId();

    const projectsRepo = {
      findAccessibleById: jest.fn().mockResolvedValue({
        workstreams: [
          {
            _id: workstreamId,
            name: 'Backend',
            order: 0,
            archivedAt: null,
          },
        ],
      }),
    };
    const tasksRepo = {
      findByProject: jest.fn().mockResolvedValue([
        {
          id: taskAId.toString(),
          workstreamId: workstreamId.toString(),
          workstreamOrder: 0,
          createdAt: new Date('2026-03-23T00:00:00.000Z'),
        },
        {
          id: taskBId.toString(),
          workstreamId: workstreamId.toString(),
          workstreamOrder: 1,
          createdAt: new Date('2026-03-24T00:00:00.000Z'),
        },
      ]),
    };

    const mapper = new ProjectsMapper();
    const service = new ProjectsService(
      projectsRepo as never,
      tasksRepo as never,
      {} as never,
      mapper,
      noopEvents,
      noopCache,
      noopAudit,
    );

    await expect(
      service.reorderProjectWorkstreamTasks(
        projectId.toString(),
        workstreamId.toString(),
        {
          workspaceId: workspaceId.toString(),
          actorUserId: ownerUserId.toString(),
        } as never,
        {
          taskIds: [taskAId.toString()],
        },
      ),
    ).rejects.toThrow(
      'Task reorder payload must include every workstream task exactly once',
    );
  });
});
