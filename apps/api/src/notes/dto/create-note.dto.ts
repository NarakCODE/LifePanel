import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NoteType, NoteStatus } from '../schemas/note.schema';

export class CreateNoteDto {
  @ApiProperty({ example: 'Meeting notes with client' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'project-fintech-redesign' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  projectId!: string;

  @ApiPropertyOptional({
    example: 'Discussed key requirements and timeline...',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    enum: NoteType,
    default: NoteType.GENERAL,
    description: 'Type of note: general, meeting, or audio',
  })
  @IsEnum(NoteType)
  @IsOptional()
  noteType?: NoteType;

  @ApiPropertyOptional({
    enum: NoteStatus,
    default: NoteStatus.COMPLETED,
    description: 'Status of note processing (for audio notes)',
  })
  @IsEnum(NoteStatus)
  @IsOptional()
  status?: NoteStatus;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/audio/note-123.mp3',
    description: 'URL to audio file (for audio notes)',
  })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional({
    example: '05:30',
    description: 'Audio duration in mm:ss format',
  })
  @IsString()
  @IsOptional()
  audioDuration?: string;
}
