import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TasksService } from '../tasks/tasks.service';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

describe('DashboardController', () => {
  const mockWorkspace: WorkspaceRequestContext = {
    workspaceId: 'workspace-1',
    actorUserId: 'user-1',
    role: 'owner' as never,
    membershipStatus: 'active' as never,
    permissions: [],
    workspaceName: 'Test Workspace',
    workspaceType: 'collaborative' as never,
  };

  const mockTasksService = {
    getTaskOverview: jest.fn().mockResolvedValue({ totalTasks: 5 }),
  };

  const mockDashboardService = {
    getSummary: jest.fn().mockResolvedValue({ tasks: { total: 5 } }),
    getActivity: jest.fn().mockResolvedValue({ recentTasks: [] }),
    getMetrics: jest.fn().mockResolvedValue({ taskCompletionRate: 20 }),
    getOverview: jest
      .fn()
      .mockResolvedValue({ summary: {}, activity: {}, metrics: {} }),
  };

  const controller = new DashboardController(
    mockTasksService as never,
    mockDashboardService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates tasks-overview to TasksService', async () => {
    const result = await controller.getTaskOverview(mockWorkspace);
    expect(mockTasksService.getTaskOverview).toHaveBeenCalledWith(mockWorkspace);
    expect(result).toEqual({ totalTasks: 5 });
  });

  it('delegates summary to DashboardService', async () => {
    const result = await controller.getSummary(mockWorkspace);
    expect(mockDashboardService.getSummary).toHaveBeenCalledWith(mockWorkspace);
    expect(result).toEqual({ tasks: { total: 5 } });
  });

  it('delegates activity to DashboardService with query', async () => {
    const query = new DashboardQueryDto();
    query.dateFrom = '2026-01-01';
    query.dateTo = '2026-01-31';

    const result = await controller.getActivity(mockWorkspace, query);
    expect(mockDashboardService.getActivity).toHaveBeenCalledWith(
      mockWorkspace,
      query,
    );
    expect(result).toEqual({ recentTasks: [] });
  });

  it('delegates metrics to DashboardService with query', async () => {
    const query = new DashboardQueryDto();
    const result = await controller.getMetrics(mockWorkspace, query);
    expect(mockDashboardService.getMetrics).toHaveBeenCalledWith(
      mockWorkspace,
      query,
    );
    expect(result).toEqual({ taskCompletionRate: 20 });
  });

  it('delegates overview to DashboardService with query', async () => {
    const query = new DashboardQueryDto();
    const result = await controller.getOverview(mockWorkspace, query);
    expect(mockDashboardService.getOverview).toHaveBeenCalledWith(
      mockWorkspace,
      query,
    );
    expect(result).toEqual({ summary: {}, activity: {}, metrics: {} });
  });
});
