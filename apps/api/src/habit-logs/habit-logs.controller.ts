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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateHabitLogDto } from './dto/create-habit-log.dto';
import { QueryHabitLogDto } from './dto/query-habit-log.dto';
import { UpdateHabitLogDto } from './dto/update-habit-log.dto';
import { HabitLogsService } from './habit-logs.service';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { WorkspacePermissionGuard } from '../workspaces/guards/workspace-permission.guard';
import { WorkspaceContext } from '../workspaces/decorators/workspace-context.decorator';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { RequireWorkspacePermission } from '../workspaces/decorators/require-workspace-permission.decorator';
import { WorkspacePermission } from '../workspaces/workspace-permissions';

@ApiTags('habit-logs')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'x-workspace-id',
  required: false,
  description: 'Workspace context for workspace-scoped habit log routes',
})
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard, WorkspacePermissionGuard)
@Controller('habit-logs')
export class HabitLogsController {
  constructor(private readonly habitLogsService: HabitLogsService) {}

  @Post()
  @RequireWorkspacePermission(WorkspacePermission.HABIT_WRITE)
  @ApiOperation({ summary: 'Create a habit log for the authenticated user' })
  @ApiCreatedResponse({ description: 'The created habit log object' })
  create(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() createHabitLogDto: CreateHabitLogDto,
  ) {
    return this.habitLogsService.create(workspace, createHabitLogDto);
  }

  @Get()
  @RequireWorkspacePermission(WorkspacePermission.HABIT_READ)
  @ApiOperation({ summary: 'Get habit logs for the authenticated user' })
  @ApiOkResponse({ description: 'The list of habit logs and pagination data' })
  findAll(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() queryHabitLogDto: QueryHabitLogDto,
  ) {
    return this.habitLogsService.findByUserId(workspace, queryHabitLogDto);
  }

  @Get('habit/:habitId')
  @RequireWorkspacePermission(WorkspacePermission.HABIT_READ)
  @ApiOperation({ summary: 'Get logs for a specific habit' })
  @ApiOkResponse({
    description: 'The list of logs for the specified habit and pagination data',
  })
  findByHabit(
    @Param('habitId') habitId: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() queryHabitLogDto: QueryHabitLogDto,
  ) {
    return this.habitLogsService.findByHabitId(
      habitId,
      workspace,
      queryHabitLogDto,
    );
  }

  @Get(':id')
  @RequireWorkspacePermission(WorkspacePermission.HABIT_READ)
  @ApiOperation({ summary: 'Get a specific habit log by ID' })
  @ApiOkResponse({ description: 'The requested habit log' })
  findOne(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.habitLogsService.findByIdAndUser(id, workspace);
  }

  @Patch(':id')
  @RequireWorkspacePermission(WorkspacePermission.HABIT_WRITE)
  @ApiOperation({ summary: 'Update a habit log' })
  @ApiOkResponse({ description: 'The updated habit log' })
  update(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() updateHabitLogDto: UpdateHabitLogDto,
  ) {
    return this.habitLogsService.update(id, workspace, updateHabitLogDto);
  }

  @Delete(':id')
  @RequireWorkspacePermission(WorkspacePermission.HABIT_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a habit log' })
  @ApiOkResponse({ description: 'Habit log successfully deleted' })
  remove(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.habitLogsService.delete(id, workspace);
  }
}
