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
import { JournalEntriesService } from './journal-entries.service';
import {
  CreateJournalEntryDto,
  UpdateJournalEntryDto,
  QueryJournalEntryDto,
  JournalEntryResponseDto,
  MoodSummaryQueryDto,
  MoodSummaryResponseDto,
} from './dto';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { WorkspacePermissionGuard } from '../workspaces/guards/workspace-permission.guard';
import { WorkspaceContext } from '../workspaces/decorators/workspace-context.decorator';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { RequireWorkspacePermission } from '../workspaces/decorators/require-workspace-permission.decorator';
import { WorkspacePermission } from '../workspaces/workspace-permissions';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@ApiTags('journal-entries')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'x-workspace-id',
  required: false,
  description: 'Workspace context for workspace-scoped journal routes',
})
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard, WorkspacePermissionGuard)
@Controller('journal-entries')
export class JournalEntriesController {
  constructor(private readonly journalEntriesService: JournalEntriesService) {}

  @Post()
  @RequireWorkspacePermission(WorkspacePermission.JOURNAL_WRITE)
  @ApiOperation({ summary: 'Create a new journal entry' })
  @ApiCreatedResponse({
    description: 'The created journal entry',
    type: JournalEntryResponseDto,
  })
  create(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() createJournalEntryDto: CreateJournalEntryDto,
  ) {
    return this.journalEntriesService.create(workspace, createJournalEntryDto);
  }

  @Get()
  @RequireWorkspacePermission(WorkspacePermission.JOURNAL_READ)
  @ApiOperation({
    summary: 'Get all journal entries for the authenticated user',
    description:
      'Supports pagination, filtering by mood, date range, tags, and text search.',
  })
  @ApiOkResponse({
    description: 'List of journal entries with pagination',
    type: JournalEntryResponseDto,
    isArray: true,
  })
  findAll(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() queryDto: QueryJournalEntryDto,
  ) {
    return this.journalEntriesService.findMany(workspace, queryDto);
  }

  @Get('mood-summary')
  @RequireWorkspacePermission(WorkspacePermission.JOURNAL_READ)
  @ApiOperation({
    summary: 'Get mood tracking summary',
    description:
      'Returns mood distribution, average mood, and trend over time.',
  })
  @ApiOkResponse({
    description: 'Mood summary statistics',
    type: MoodSummaryResponseDto,
  })
  getMoodSummary(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() queryDto: MoodSummaryQueryDto,
  ) {
    return this.journalEntriesService.getMoodSummary(workspace, queryDto);
  }

  @Get(':id')
  @RequireWorkspacePermission(WorkspacePermission.JOURNAL_READ)
  @ApiOperation({ summary: 'Get a specific journal entry by ID' })
  @ApiParam({ name: 'id', description: 'Journal entry ID' })
  @ApiOkResponse({
    description: 'The requested journal entry',
    type: JournalEntryResponseDto,
  })
  findOne(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.journalEntriesService.findByIdAndUser(id.toString(), workspace);
  }

  @Patch(':id')
  @RequireWorkspacePermission(WorkspacePermission.JOURNAL_WRITE)
  @ApiOperation({ summary: 'Update a journal entry' })
  @ApiParam({ name: 'id', description: 'Journal entry ID' })
  @ApiOkResponse({
    description: 'The updated journal entry',
    type: JournalEntryResponseDto,
  })
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() updateJournalEntryDto: UpdateJournalEntryDto,
  ) {
    return this.journalEntriesService.update(
      id.toString(),
      workspace,
      updateJournalEntryDto,
    );
  }

  @Delete(':id')
  @RequireWorkspacePermission(WorkspacePermission.JOURNAL_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a journal entry' })
  @ApiParam({ name: 'id', description: 'Journal entry ID' })
  @ApiOkResponse({ description: 'Journal entry successfully deleted' })
  remove(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.journalEntriesService.delete(id.toString(), workspace);
  }
}
