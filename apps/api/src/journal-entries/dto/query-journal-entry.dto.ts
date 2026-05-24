import { IsOptional, IsEnum, IsDate, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { MoodLevel } from '../schemas/journal-entry.schema';

export class QueryJournalEntryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: MoodLevel })
  @IsEnum(MoodLevel)
  @IsOptional()
  mood?: MoodLevel;

  @ApiPropertyOptional({
    description: 'Filter by entry date (from)',
    example: '2026-01-01',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dateFrom?: Date;

  @ApiPropertyOptional({
    description: 'Filter by entry date (to)',
    example: '2026-12-31',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dateTo?: Date;

  @ApiPropertyOptional({
    description: 'Filter by tag',
    example: 'gratitude',
  })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiPropertyOptional({
    description: 'Search in title and content',
    example: 'productive day',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['entryDate', 'createdAt', 'updatedAt'],
    default: 'entryDate',
  })
  @IsString()
  @IsOptional()
  sortBy?: 'entryDate' | 'createdAt' | 'updatedAt' = 'entryDate';
}
