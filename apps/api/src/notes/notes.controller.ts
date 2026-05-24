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
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { QueryNoteDto } from './dto/query-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NoteResponseDto, NotesListDataDto } from './dto/note-response.dto';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { WorkspacePermissionGuard } from '../workspaces/guards/workspace-permission.guard';
import { WorkspaceContext } from '../workspaces/decorators/workspace-context.decorator';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { RequireWorkspacePermission } from '../workspaces/decorators/require-workspace-permission.decorator';
import { WorkspacePermission } from '../workspaces/workspace-permissions';

@ApiTags('notes')
@ApiExtraModels(NotesListDataDto, NoteResponseDto)
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'x-workspace-id',
  required: false,
  description: 'Workspace context for workspace-scoped note routes',
})
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard, WorkspacePermissionGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @RequireWorkspacePermission(WorkspacePermission.NOTE_WRITE)
  @ApiOperation({ summary: 'Create a new note' })
  @ApiCreatedResponse({
    description: 'The created note object',
    type: NoteResponseDto,
  })
  create(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() createNoteDto: CreateNoteDto,
  ) {
    return this.notesService.create(workspace, createNoteDto);
  }

  @Get('by-project/:projectId')
  @RequireWorkspacePermission(WorkspacePermission.NOTE_READ)
  @ApiOperation({ summary: 'Get notes by project ID' })
  @ApiOkResponse({
    description: 'List of notes for the project',
    type: NotesListDataDto,
  })
  findByProject(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Param('projectId') projectId: string,
    @Query() queryNoteDto: QueryNoteDto,
  ) {
    return this.notesService.findByProject(workspace, projectId, queryNoteDto);
  }

  @Get()
  @RequireWorkspacePermission(WorkspacePermission.NOTE_READ)
  @ApiOperation({ summary: 'Get all notes with pagination and filtering' })
  @ApiOkResponse({
    description: 'List of matching notes and total count',
    type: NotesListDataDto,
  })
  findAll(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() queryNoteDto: QueryNoteDto,
  ) {
    return this.notesService.findMany(workspace, queryNoteDto);
  }

  @Get(':id')
  @RequireWorkspacePermission(WorkspacePermission.NOTE_READ)
  @ApiOperation({ summary: 'Get a specific note by ID' })
  @ApiOkResponse({ description: 'The note object', type: NoteResponseDto })
  findOne(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.notesService.findById(id, workspace);
  }

  @Patch(':id')
  @RequireWorkspacePermission(WorkspacePermission.NOTE_WRITE)
  @ApiOperation({ summary: 'Update a specific note' })
  @ApiOkResponse({
    description: 'The updated note object',
    type: NoteResponseDto,
  })
  update(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() updateNoteDto: UpdateNoteDto,
  ) {
    return this.notesService.update(id, workspace, updateNoteDto);
  }

  @Delete(':id')
  @RequireWorkspacePermission(WorkspacePermission.NOTE_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a note' })
  @ApiOkResponse({ description: 'Note successfully deleted' })
  remove(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.notesService.delete(id, workspace);
  }
}
