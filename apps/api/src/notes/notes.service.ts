import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { NotesRepository } from './notes.repository';
import { NoteDocument, NoteStatus, NoteType } from './schemas/note.schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { QueryNoteDto } from './dto/query-note.dto';
import { NoteResponseDto, NotesListDataDto } from './dto/note-response.dto';
import { UsersService } from '../users/users.service';
import { ProjectsService } from '../projects/projects.service';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    private readonly notesRepo: NotesRepository,
    private readonly usersService: UsersService,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(
    workspace: WorkspaceRequestContext,
    dto: CreateNoteDto,
  ): Promise<NoteResponseDto> {
    const author = await this.resolveAuthorSnapshot(workspace.actorUserId);
    const projectContext = await this.projectsService.resolveTaskProjectContext(
      workspace,
      dto.projectId,
    );

    const note = await this.notesRepo.create(
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      {
        title: dto.title,
        projectId: projectContext.projectId,
        projectName: projectContext.projectName,
        content: dto.content,
        noteType: dto.noteType ?? NoteType.GENERAL,
        status: dto.status ?? NoteStatus.COMPLETED,
        audioUrl: dto.audioUrl,
        audioDuration: dto.audioDuration,
        author,
      },
    );

    return this.toNoteResponse(note);
  }

  async findById(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<NoteResponseDto> {
    const note = await this.notesRepo.findById(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return this.toNoteResponse(note);
  }

  async findByProject(
    workspace: WorkspaceRequestContext,
    projectId: string,
    query: QueryNoteDto,
  ): Promise<NotesListDataDto> {
    const { items, total, page, limit, totalPages } =
      await this.notesRepo.findByProject(
        {
          workspaceId: workspace.workspaceId,
          userId: workspace.actorUserId,
        },
        projectId,
        query,
      );

    return {
      notes: items.map((note) => this.toNoteResponse(note)),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findMany(
    workspace: WorkspaceRequestContext,
    query: QueryNoteDto,
  ): Promise<NotesListDataDto> {
    const { items, total, page, limit, totalPages } =
      await this.notesRepo.findWithPagination(
        {
          workspaceId: workspace.workspaceId,
          userId: workspace.actorUserId,
        },
        query,
      );

    return {
      notes: items.map((note) => this.toNoteResponse(note)),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async update(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateNoteDto,
  ): Promise<NoteResponseDto> {
    const existingNote = await this.notesRepo.findById(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!existingNote) {
      throw new NotFoundException('Note not found');
    }

    const updatePayload: Record<string, unknown> = {};

    if (dto.title !== undefined) {
      updatePayload.title = dto.title;
    }

    if (dto.content !== undefined) {
      updatePayload.content = dto.content;
    }

    if (dto.noteType !== undefined) {
      updatePayload.noteType = dto.noteType;
    }

    if (dto.status !== undefined) {
      updatePayload.status = dto.status;
    }

    if (dto.audioUrl !== undefined) {
      updatePayload.audioUrl = dto.audioUrl;
    }

    if (dto.audioDuration !== undefined) {
      updatePayload.audioDuration = dto.audioDuration;
    }

    // Handle project change
    if (
      dto.projectId !== undefined &&
      dto.projectId !== existingNote.projectId
    ) {
      const projectContext =
        await this.projectsService.resolveTaskProjectContext(
          workspace,
          dto.projectId,
        );
      updatePayload.projectId = projectContext.projectId;
      updatePayload.projectName = projectContext.projectName;
    }

    if (Object.keys(updatePayload).length === 0) {
      return this.toNoteResponse(existingNote);
    }

    const updatedNote = await this.notesRepo.updateById(
      id,
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      { $set: updatePayload },
    );

    if (!updatedNote) {
      throw new NotFoundException('Note not found');
    }

    return this.toNoteResponse(updatedNote);
  }

  async delete(id: string, workspace: WorkspaceRequestContext): Promise<void> {
    const deleted = await this.notesRepo.deleteById(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!deleted) {
      throw new NotFoundException('Note not found');
    }
  }

  private async resolveAuthorSnapshot(
    userId: string,
  ): Promise<{ id: Types.ObjectId; name: string; avatarUrl?: string } | null> {
    try {
      const user = await this.usersService.findById(userId);
      if (!user) {
        return null;
      }
      return {
        id: new Types.ObjectId(user.id),
        name: user.displayName ?? user.email,
        avatarUrl: undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to resolve author snapshot: ${error}`);
      return null;
    }
  }

  async getNoteOverview(workspace: WorkspaceRequestContext) {
    return this.notesRepo.getNoteOverview({
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
  }

  private toNoteResponse(note: NoteDocument): NoteResponseDto {
    return {
      id: note._id.toString(),
      workspaceId: note.workspaceId?.toString() ?? '',
      title: note.title,
      content: note.content,
      noteType: note.noteType,
      status: note.status,
      projectId: note.projectId,
      projectName: note.projectName,
      audioUrl: note.audioUrl,
      audioDuration: note.audioDuration,
      author: note.author
        ? {
            id: note.author.id.toString(),
            name: note.author.name,
            avatarUrl: note.author.avatarUrl,
          }
        : undefined,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}
