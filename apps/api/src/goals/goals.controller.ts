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
  ApiParam,
} from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { QueryGoalDto } from './dto/query-goal.dto';
import { LogProgressDto } from './dto/log-progress.dto';
import { LinkTasksDto } from './dto/link-tasks.dto';
import { LinkHabitsDto } from './dto/link-habits.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { WorkspacePermissionGuard } from '../workspaces/guards/workspace-permission.guard';
import { WorkspaceContext } from '../workspaces/decorators/workspace-context.decorator';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { RequireWorkspacePermission } from '../workspaces/decorators/require-workspace-permission.decorator';
import { WorkspacePermission } from '../workspaces/workspace-permissions';

@ApiTags('goals')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'x-workspace-id',
  required: false,
  description: 'Workspace context for workspace-scoped goal routes',
})
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard, WorkspacePermissionGuard)
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @RequireWorkspacePermission(WorkspacePermission.GOAL_WRITE)
  @ApiOperation({ summary: 'Create a new goal' })
  @ApiCreatedResponse({ description: 'The created goal object' })
  create(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() createGoalDto: CreateGoalDto,
  ) {
    return this.goalsService.create(workspace, createGoalDto);
  }

  @Get()
  @RequireWorkspacePermission(WorkspacePermission.GOAL_READ)
  @ApiOperation({ summary: 'Get all goals for the authenticated user' })
  @ApiOkResponse({
    description:
      'The list of goals with computed progress and pagination details',
  })
  findAll(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() queryGoalDto: QueryGoalDto,
  ) {
    return this.goalsService.findMany(workspace, queryGoalDto);
  }

  @Get(':id')
  @RequireWorkspacePermission(WorkspacePermission.GOAL_READ)
  @ApiOperation({
    summary: 'Get a specific goal by ID with live computed progress',
  })
  @ApiOkResponse({ description: 'The requested goal' })
  findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.goalsService.findByIdAndUser(id, workspace);
  }

  @Patch(':id')
  @RequireWorkspacePermission(WorkspacePermission.GOAL_WRITE)
  @ApiOperation({ summary: 'Update a goal' })
  @ApiOkResponse({ description: 'The updated goal' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() updateGoalDto: UpdateGoalDto,
  ) {
    return this.goalsService.update(id, workspace, updateGoalDto);
  }

  @Delete(':id')
  @RequireWorkspacePermission(WorkspacePermission.GOAL_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a goal permanently' })
  @ApiOkResponse({ description: 'Goal successfully deleted' })
  remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.goalsService.delete(id, workspace);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Progress Logging
  // ─────────────────────────────────────────────────────────────────────────

  @Post(':id/log-progress')
  @RequireWorkspacePermission(WorkspacePermission.GOAL_WRITE)
  @ApiOperation({
    summary: 'Log progress for a manual goal',
    description:
      'Adds a progress log entry and increments currentValue. Only available for manual and mixed goals.',
  })
  @ApiParam({ name: 'id', description: 'Goal ID' })
  @ApiCreatedResponse({ description: 'Progress logged successfully' })
  logProgress(
    @Param('id', ParseObjectIdPipe) id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() dto: LogProgressDto,
  ) {
    return this.goalsService.logProgress(id, workspace, dto);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Task Linking
  // ─────────────────────────────────────────────────────────────────────────

  @Post(':id/link-tasks')
  @RequireWorkspacePermission(WorkspacePermission.GOAL_WRITE)
  @ApiOperation({
    summary: 'Link tasks to a goal',
    description:
      'Links existing tasks to the goal. Tasks must belong to the authenticated user.',
  })
  @ApiParam({ name: 'id', description: 'Goal ID' })
  @ApiCreatedResponse({ description: 'Tasks linked successfully' })
  linkTasks(
    @Param('id', ParseObjectIdPipe) id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() dto: LinkTasksDto,
  ) {
    return this.goalsService.linkTasks(id, workspace, dto);
  }

  @Delete(':id/unlink-task/:taskId')
  @RequireWorkspacePermission(WorkspacePermission.GOAL_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unlink a task from a goal',
    description: 'Removes the link between a task and the goal.',
  })
  @ApiParam({ name: 'id', description: 'Goal ID' })
  @ApiParam({ name: 'taskId', description: 'Task ID to unlink' })
  @ApiOkResponse({ description: 'Task unlinked successfully' })
  unlinkTask(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('taskId', ParseObjectIdPipe) taskId: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.goalsService.unlinkTask(id, workspace, taskId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Habit Linking
  // ─────────────────────────────────────────────────────────────────────────

  @Post(':id/link-habits')
  @RequireWorkspacePermission(WorkspacePermission.GOAL_WRITE)
  @ApiOperation({
    summary: 'Link habits to a goal',
    description:
      'Links existing habits to the goal. Habits must belong to the authenticated user.',
  })
  @ApiParam({ name: 'id', description: 'Goal ID' })
  @ApiCreatedResponse({ description: 'Habits linked successfully' })
  linkHabits(
    @Param('id', ParseObjectIdPipe) id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() dto: LinkHabitsDto,
  ) {
    return this.goalsService.linkHabits(id, workspace, dto);
  }

  @Delete(':id/unlink-habit/:habitId')
  @RequireWorkspacePermission(WorkspacePermission.GOAL_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unlink a habit from a goal',
    description: 'Removes the link between a habit and the goal.',
  })
  @ApiParam({ name: 'id', description: 'Goal ID' })
  @ApiParam({ name: 'habitId', description: 'Habit ID to unlink' })
  @ApiOkResponse({ description: 'Habit unlinked successfully' })
  unlinkHabit(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('habitId', ParseObjectIdPipe) habitId: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.goalsService.unlinkHabit(id, workspace, habitId);
  }
}
