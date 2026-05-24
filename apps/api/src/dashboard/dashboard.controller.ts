import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksService } from '../tasks/tasks.service';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { WorkspacePermissionGuard } from '../workspaces/guards/workspace-permission.guard';
import { WorkspaceContext } from '../workspaces/decorators/workspace-context.decorator';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { RequireWorkspacePermission } from '../workspaces/decorators/require-workspace-permission.decorator';
import { WorkspacePermission } from '../workspaces/workspace-permissions';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { DashboardSummaryResponseDto } from './dto/dashboard-summary-response.dto';
import { DashboardActivityResponseDto } from './dto/dashboard-activity-response.dto';
import { DashboardMetricsResponseDto } from './dto/dashboard-metrics-response.dto';
import { DashboardOverviewResponseDto } from './dto/dashboard-overview-response.dto';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'x-workspace-id',
  required: false,
  description: 'Workspace context for dashboard aggregation routes',
})
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard, WorkspacePermissionGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('tasks-overview')
  @RequireWorkspacePermission(WorkspacePermission.TASK_READ)
  @ApiOperation({
    summary: 'Get aggregated task overview metrics for the dashboard',
  })
  @ApiOkResponse({ description: 'Object containing aggregated task data' })
  getTaskOverview(@WorkspaceContext() workspace: WorkspaceRequestContext) {
    return this.tasksService.getTaskOverview(workspace);
  }

  @Get('summary')
  @RequireWorkspacePermission(WorkspacePermission.WORKSPACE_READ)
  @ApiOperation({ summary: 'Get overall dashboard summary metrics' })
  @ApiOkResponse({
    description: 'Aggregated summary across all modules',
    type: DashboardSummaryResponseDto,
  })
  async getSummary(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ): Promise<DashboardSummaryResponseDto> {
    return this.dashboardService.getSummary(workspace);
  }

  @Get('activity')
  @RequireWorkspacePermission(WorkspacePermission.WORKSPACE_READ)
  @ApiOperation({ summary: 'Get recent activity across all modules' })
  @ApiOkResponse({
    description:
      'Recent items from tasks, issues, transactions, notes, journal, and notifications',
    type: DashboardActivityResponseDto,
  })
  async getActivity(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardActivityResponseDto> {
    return this.dashboardService.getActivity(workspace, query);
  }

  @Get('metrics')
  @RequireWorkspacePermission(WorkspacePermission.WORKSPACE_READ)
  @ApiOperation({ summary: 'Get detailed dashboard metrics and trends' })
  @ApiOkResponse({
    description:
      'Detailed metrics including completion rates, financials, streaks, and mood trends',
    type: DashboardMetricsResponseDto,
  })
  async getMetrics(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardMetricsResponseDto> {
    return this.dashboardService.getMetrics(workspace, query);
  }

  @Get('overview')
  @RequireWorkspacePermission(WorkspacePermission.WORKSPACE_READ)
  @ApiOperation({
    summary: 'Get combined dashboard overview (summary + activity + metrics)',
  })
  @ApiOkResponse({
    description: 'Complete dashboard payload in a single request',
    type: DashboardOverviewResponseDto,
  })
  async getOverview(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardOverviewResponseDto> {
    return this.dashboardService.getOverview(workspace, query);
  }
}
