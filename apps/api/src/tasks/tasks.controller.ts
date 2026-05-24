import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import {
  AddTaskCommentDto,
  DuplicateTaskDto,
  MoveTaskDto,
} from './dto/task-action.dto';
import { CreateCustomStatusDto, LogTimeDto } from './dto/advanced-tasks.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MyTasksResultDto, TaskResponseDto } from './dto/task-response.dto';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { WorkspacePermissionGuard } from '../workspaces/guards/workspace-permission.guard';
import { WorkspaceContext } from '../workspaces/decorators/workspace-context.decorator';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { RequireWorkspacePermission } from '../workspaces/decorators/require-workspace-permission.decorator';
import { WorkspacePermission } from '../workspaces/workspace-permissions';

@ApiTags('tasks')
@ApiExtraModels(MyTasksResultDto, TaskResponseDto)
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'x-workspace-id',
  required: false,
  description: 'Workspace context for workspace-scoped task routes',
})
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard, WorkspacePermissionGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @RequireWorkspacePermission(WorkspacePermission.TASK_WRITE)
  @ApiOperation({ summary: 'Create a new task' })
  @ApiCreatedResponse({
    description: 'The created task object',
    type: TaskResponseDto,
  })
  create(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(workspace, createTaskDto);
  }

  @Get('my-tasks')
  @RequireWorkspacePermission(WorkspacePermission.TASK_READ)
  @ApiOperation({
    summary:
      'Get the authenticated user tasks with pagination and task filter counts',
  })
  @ApiOkResponse({
    description: 'The filtered task list plus meta.filterCounts',
    type: MyTasksResultDto,
  })
  getMyTasks(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() queryTaskDto: QueryTaskDto,
  ) {
    return this.tasksService.getMyTasks(workspace, queryTaskDto);
  }

  @Get()
  @RequireWorkspacePermission(WorkspacePermission.TASK_READ)
  @ApiOperation({ summary: 'Get all tasks with pagination and filtering' })
  @ApiOkResponse({
    description: 'List of matching tasks and total count',
    type: MyTasksResultDto,
  })
  findAll(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() queryTaskDto: QueryTaskDto,
  ) {
    return this.tasksService.findMany(workspace, queryTaskDto);
  }

  @Get(':id')
  @RequireWorkspacePermission(WorkspacePermission.TASK_READ)
  @ApiOperation({ summary: 'Get a specific task by ID' })
  @ApiOkResponse({ description: 'The task object', type: TaskResponseDto })
  findOne(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.tasksService.findByIdAndUser(id, workspace);
  }

  @Patch(':id')
  @RequireWorkspacePermission(WorkspacePermission.TASK_WRITE)
  @ApiOperation({ summary: 'Update a specific task' })
  @ApiOkResponse({
    description: 'The updated task object',
    type: TaskResponseDto,
  })
  update(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, workspace, updateTaskDto);
  }

  @Patch(':id/archive')
  @RequireWorkspacePermission(WorkspacePermission.TASK_WRITE)
  @ApiOperation({ summary: 'Archive a task' })
  @ApiOkResponse({
    description: 'The archived task object',
    type: TaskResponseDto,
  })
  archive(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.tasksService.archive(id, workspace);
  }

  @Patch(':id/restore')
  @RequireWorkspacePermission(WorkspacePermission.TASK_WRITE)
  @ApiOperation({ summary: 'Restore an archived task' })
  @ApiOkResponse({
    description: 'The restored task object',
    type: TaskResponseDto,
  })
  restore(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.tasksService.restore(id, workspace);
  }

  @Post(':id/duplicate')
  @RequireWorkspacePermission(WorkspacePermission.TASK_WRITE)
  @ApiOperation({ summary: 'Duplicate a task' })
  @ApiCreatedResponse({
    description: 'The duplicated task object',
    type: TaskResponseDto,
  })
  duplicate(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() duplicateTaskDto: DuplicateTaskDto,
  ) {
    return this.tasksService.duplicate(id, workspace, duplicateTaskDto);
  }

  @Patch(':id/move')
  @RequireWorkspacePermission(WorkspacePermission.TASK_WRITE)
  @ApiOperation({ summary: 'Move a task between projects or workstreams' })
  @ApiOkResponse({
    description: 'The moved task object',
    type: TaskResponseDto,
  })
  move(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() moveTaskDto: MoveTaskDto,
  ) {
    return this.tasksService.move(id, workspace, moveTaskDto);
  }

  @Post(':id/comments')
  @RequireWorkspacePermission(WorkspacePermission.TASK_WRITE)
  @ApiOperation({ summary: 'Add a markdown comment with mentions to a task' })
  @ApiCreatedResponse({
    description: 'The task object with the appended comment',
    type: TaskResponseDto,
  })
  addComment(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() addTaskCommentDto: AddTaskCommentDto,
  ) {
    return this.tasksService.addComment(id, workspace, addTaskCommentDto);
  }

  @Delete(':id')
  @RequireWorkspacePermission(WorkspacePermission.TASK_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiOkResponse({ description: 'Task successfully deleted' })
  remove(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.tasksService.delete(id, workspace);
  }

  // --- Advanced Endpoints: Time Tracking ---

  @Post(':id/time-logs')
  @RequireWorkspacePermission(WorkspacePermission.TASK_WRITE)
  @ApiOperation({ summary: 'Log time spent on a task' })
  logTime(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() dto: LogTimeDto,
  ) {
    return this.tasksService.logTime(id, workspace, dto);
  }

  @Get(':id/time-logs')
  @RequireWorkspacePermission(WorkspacePermission.TASK_READ)
  @ApiOperation({ summary: 'Get time logs for a task' })
  getTimeLogs(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.tasksService.getTimeLogs(id, workspace);
  }

  @Delete(':id/time-logs/:logId')
  @RequireWorkspacePermission(WorkspacePermission.TASK_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a time log entry' })
  deleteTimeLog(
    @Param('id') id: string,
    @Param('logId') logId: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.tasksService.deleteTimeLog(id, logId, workspace);
  }

  // --- Advanced Endpoints: Custom Statuses ---

  @Post('statuses')
  @RequireWorkspacePermission(WorkspacePermission.TASK_WRITE)
  @ApiOperation({ summary: 'Create a custom status for the workspace' })
  createCustomStatus(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() dto: CreateCustomStatusDto,
  ) {
    return this.tasksService.createCustomStatus(workspace, dto);
  }

  @Get('statuses')
  @RequireWorkspacePermission(WorkspacePermission.TASK_READ)
  @ApiOperation({ summary: 'Get all custom statuses for the workspace' })
  getCustomStatuses(@WorkspaceContext() workspace: WorkspaceRequestContext) {
    return this.tasksService.getCustomStatuses(workspace);
  }
}
