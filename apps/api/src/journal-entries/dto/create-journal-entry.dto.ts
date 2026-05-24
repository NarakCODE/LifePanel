import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsDate,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MoodLevel } from '../schemas/journal-entry.schema';

export class CreateJournalEntryDto {
  @ApiPropertyOptional({
    example: '2026-03-21T00:00:00Z',
    description: 'Date of the journal entry (defaults to current date)',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  entryDate?: Date;

  @ApiPropertyOptional({ example: 'My Day' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'Today was a productive day...' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ enum: MoodLevel, example: MoodLevel.GOOD })
  @IsEnum(MoodLevel)
  @IsOptional()
  mood?: MoodLevel;

  @ApiPropertyOptional({ example: ['productivity', 'gratitude'] })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  @IsOptional()
  tags?: string[];
}
