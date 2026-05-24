import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NoteType, NoteStatus } from '../schemas/note.schema';

export class QueryNoteDto {
  @ApiPropertyOptional({
    description: 'Filter by project ID',
    example: 'project-fintech-redesign',
  })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({
    enum: NoteType,
    description: 'Filter by note type',
  })
  @IsEnum(NoteType)
  @IsOptional()
  noteType?: NoteType;

  @ApiPropertyOptional({
    enum: NoteStatus,
    description: 'Filter by note status',
  })
  @IsEnum(NoteStatus)
  @IsOptional()
  status?: NoteStatus;

  @ApiPropertyOptional({
    description: 'Search in title and content',
    example: 'meeting',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
