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
} from '@nestjs/swagger';
import { HabitsService } from './habits.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { QueryHabitDto } from './dto/query-habit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { WorkspacePermissionGuard } from '../workspaces/guards/workspace-permission.guard';
import { WorkspaceContext } from '../workspaces/decorators/workspace-context.decorator';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { RequireWorkspacePermission } from '../workspaces/decorators/require-workspace-permission.decorator';
import { WorkspacePermission } from '../workspaces/workspace-permissions';

@ApiTags('habits')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'x-workspace-id',
  required: false,
  description: 'Workspace context for workspace-scoped habit routes',
})
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard, WorkspacePermissionGuard)
@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Post()
  @RequireWorkspacePermission(WorkspacePermission.HABIT_WRITE)
  @ApiOperation({ summary: 'Create a new habit' })
  @ApiCreatedResponse({ description: 'The created habit object' })
  create(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() createHabitDto: CreateHabitDto,
  ) {
    return this.habitsService.create(workspace, createHabitDto);
  }

  @Get()
  @RequireWorkspacePermission(WorkspacePermission.HABIT_READ)
  @ApiOperation({ summary: 'Get all habits for the authenticated user' })
  @ApiOkResponse({ description: 'The list of habits and pagination details' })
  findAll(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() queryHabitDto: QueryHabitDto,
  ) {
    return this.habitsService.findMany(workspace, queryHabitDto);
  }

  @Get(':id')
  @RequireWorkspacePermission(WorkspacePermission.HABIT_READ)
  @ApiOperation({ summary: 'Get a specific habit by ID' })
  @ApiOkResponse({ description: 'The requested habit' })
  findOne(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.habitsService.findByIdAndUser(id, workspace);
  }

  @Patch(':id')
  @RequireWorkspacePermission(WorkspacePermission.HABIT_WRITE)
  @ApiOperation({ summary: 'Update a habit' })
  @ApiOkResponse({ description: 'The updated habit' })
  update(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() updateHabitDto: UpdateHabitDto,
  ) {
    return this.habitsService.update(id, workspace, updateHabitDto);
  }

  @Patch(':id/archive')
  @RequireWorkspacePermission(WorkspacePermission.HABIT_WRITE)
  @ApiOperation({ summary: 'Archive a habit' })
  @ApiOkResponse({ description: 'The archived habit' })
  archive(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.habitsService.archive(id, workspace);
  }

  @Delete(':id')
  @RequireWorkspacePermission(WorkspacePermission.HABIT_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a habit permanently' })
  @ApiOkResponse({ description: 'Habit successfully deleted' })
  remove(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.habitsService.delete(id, workspace);
  }
}
