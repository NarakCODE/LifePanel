import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { NoteType, NoteStatus } from '../schemas/note.schema';

@Exclude()
export class NoteAuthorResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  name!: string;

  @Expose()
  @ApiPropertyOptional()
  avatarUrl?: string;

  constructor(partial: Partial<NoteAuthorResponseDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class NoteResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  workspaceId!: string;

  @Expose()
  @ApiProperty()
  title!: string;

  @Expose()
  @ApiPropertyOptional()
  content?: string;

  @Expose()
  @ApiProperty({ enum: NoteType })
  noteType!: NoteType;

  @Expose()
  @ApiProperty({ enum: NoteStatus })
  status!: NoteStatus;

  @Expose()
  @ApiProperty()
  projectId!: string;

  @Expose()
  @ApiPropertyOptional()
  projectName?: string;

  @Expose()
  @ApiPropertyOptional()
  audioUrl?: string;

  @Expose()
  @ApiPropertyOptional()
  audioDuration?: string;

  @Expose()
  @Type(() => NoteAuthorResponseDto)
  @ApiPropertyOptional({ type: NoteAuthorResponseDto })
  author?: NoteAuthorResponseDto;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  @Expose()
  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<NoteResponseDto>) {
    Object.assign(this, partial);
  }
}

export class NotePaginationDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

// Flat list response for consistency with other controllers
export class NotesListDataDto {
  @ApiProperty({ type: [NoteResponseDto] })
  notes!: NoteResponseDto[];

  @ApiProperty({ type: NotePaginationDto })
  pagination!: NotePaginationDto;
}

// Legacy DTO for backwards compatibility (deprecated)
export class NotesDataDto {
  @ApiProperty({ type: [NoteResponseDto] })
  notes!: NoteResponseDto[];

  @ApiProperty({ type: NotePaginationDto })
  pagination!: NotePaginationDto;
}

// Legacy DTO for backwards compatibility (deprecated)
export class NotesResultDto {
  @ApiProperty({ type: NotesDataDto })
  data!: NotesDataDto;
}
