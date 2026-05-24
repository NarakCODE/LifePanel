import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectDetailsResponseDto } from './dto/project-details-response.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { MoveProjectTaskDto } from './dto/move-project-task.dto';
import { ReorderProjectTasksDto } from './dto/reorder-project-tasks.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { WorkspacePermissionGuard } from '../workspaces/guards/workspace-permission.guard';
import { WorkspaceContext } from '../workspaces/decorators/workspace-context.decorator';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { RequireWorkspacePermission } from '../workspaces/decorators/require-workspace-permission.decorator';
import { WorkspacePermission } from '../workspaces/workspace-permissions';
import { UpdateTaskDto } from '../tasks/dto/update-task.dto';
import { TaskResponseDto } from '../tasks/dto/task-response.dto';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';

@ApiTags('projects')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'x-workspace-id',
  required: false,
  description: 'Workspace context for workspace-scoped business routes',
})
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard, WorkspacePermissionGuard)
// (api-use-interceptors) apply logging + response-envelope at controller level
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ── Create ───────────────────────────────────────────────────────────────

  @Post()
  @RequireWorkspacePermission(WorkspacePermission.PROJECT_WRITE)
  @ApiOperation({ summary: 'Create a new project with optional workstreams' })
  @ApiCreatedResponse({
    description: 'The created project object',
    type: ProjectResponseDto,
  })
  create(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(workspace, createProjectDto);
  }

  // ── Read ─────────────────────────────────────────────────────────────────

  @Get()
  @RequireWorkspacePermission(WorkspacePermission.PROJECT_READ)
  @ApiOperation({
    summary: 'Get all accessible projects for the authenticated user',
    description:
      'Results are cached per workspace/user pair (TTL: 2 min). Cache is invalidated on any mutation.',
  })
  @ApiOkResponse({
    description: 'Project list for task creation and grouping',
    type: [ProjectResponseDto],
  })
  findAll(@WorkspaceContext() workspace: WorkspaceRequestContext) {
    return this.projectsService.findAllAccessible(workspace);
  }

  @Get('overview')
  @RequireWorkspacePermission(WorkspacePermission.PROJECT_READ)
  @ApiOperation({
    summary: 'Get an aggregate overview of projects grouped by status',
    description:
      'Used by the dashboard. Cached per workspace/user (TTL: 5 min).',
  })
  @ApiOkResponse({ description: 'Project overview statistics' })
  getOverview(@WorkspaceContext() workspace: WorkspaceRequestContext) {
    return this.projectsService.getProjectOverview(workspace);
  }

  @Get(':id')
  @RequireWorkspacePermission(WorkspacePermission.PROJECT_READ)
  @ApiOperation({ summary: 'Get a specific accessible project by id' })
  @ApiOkResponse({
    description: 'The requested project',
    type: ProjectResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Project not found' })
  findOne(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.projectsService.findByIdAccessible(id, workspace);
  }

  @Get(':id/details')
  @RequireWorkspacePermission(WorkspacePermission.PROJECT_READ)
  @ApiOperation({
    summary: 'Get the aggregated project details payload for the project page',
    description:
      'Heavy aggregate query. Cached per workspace/project (TTL: 1 min). Invalidated on any task or project mutation.',
  })
  @ApiOkResponse({
    description: 'Project details aggregate for the project dashboard page',
    type: ProjectDetailsResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Project not found' })
  getDetails(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.projectsService.getDetails(id, workspace);
  }

  // ── Task ordering ────────────────────────────────────────────────────────

  @Patch(':id/tasks/reorder')
  @RequireWorkspacePermission(WorkspacePermission.PROJECT_WRITE)
  @ApiOperation({ summary: 'Reorder the flat task list for a project' })
  @ApiOkResponse({
    description: 'Project task order updated successfully',
  })
  @ApiNotFoundResponse({ description: 'Project not found' })
  reorderProjectTasks(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() reorderProjectTasksDto: ReorderProjectTasksDto,
  ) {
    return this.projectsService.reorderProjectTasks(
      id,
      workspace,
      reorderProjectTasksDto,
    );
  }

  @Patch(':id/workstreams/:workstreamId/tasks/reorder')
  @RequireWorkspacePermission(WorkspacePermission.PROJECT_WRITE)
  @ApiOperation({ summary: 'Reorder tasks inside a project workstream' })
  @ApiOkResponse({
    description: 'Workstream task order updated successfully',
  })
  @ApiNotFoundResponse({ description: 'Project or workstream not found' })
  reorderWorkstreamTasks(
    @Param('id') id: string,
    @Param('workstreamId') workstreamId: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() reorderProjectTasksDto: ReorderProjectTasksDto,
  ) {
    return this.projectsService.reorderProjectWorkstreamTasks(
      id,
      workstreamId,
      workspace,
      reorderProjectTasksDto,
    );
  }

  // ── Task mutations within project context ────────────────────────────────

  @Patch(':id/tasks/:taskId/move')
  @RequireWorkspacePermission(WorkspacePermission.PROJECT_WRITE)
  @ApiOperation({ summary: 'Move a task to a different project workstream' })
  @ApiOkResponse({
    description: 'The updated task after the move',
    type: TaskResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Project or task not found' })
  moveTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() moveProjectTaskDto: MoveProjectTaskDto,
  ) {
    return this.projectsService.moveProjectTask(
      id,
      taskId,
      workspace,
      moveProjectTaskDto,
    );
  }

  @Patch(':id/tasks/:taskId')
  @RequireWorkspacePermission(WorkspacePermission.PROJECT_WRITE)
  @ApiOperation({
    summary: 'Update a project task through the project context',
  })
  @ApiOkResponse({
    description: 'The updated task object',
    type: TaskResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Project or task not found' })
  updateTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.projectsService.updateProjectTask(
      id,
      taskId,
      workspace,
      updateTaskDto,
    );
  }

  // ── Project mutations ────────────────────────────────────────────────────

  @Patch(':id')
  @RequireWorkspacePermission(WorkspacePermission.PROJECT_WRITE)
  @ApiOperation({ summary: 'Update a project in the active workspace' })
  @ApiOkResponse({
    description: 'The updated project',
    type: ProjectResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Project not found' })
  update(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, workspace, updateProjectDto);
  }

  @Delete(':id')
  @RequireWorkspacePermission(WorkspacePermission.PROJECT_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a project in the active workspace' })
  @ApiOkResponse({ description: 'Project successfully deleted' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  remove(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.projectsService.delete(id, workspace);
  }
}
