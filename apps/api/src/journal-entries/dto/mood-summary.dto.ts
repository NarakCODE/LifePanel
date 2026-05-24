import { IsOptional, IsDate, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MoodLevel } from '../schemas/journal-entry.schema';

/**
 * DTO for querying mood summary
 */
export class MoodSummaryQueryDto {
  @ApiPropertyOptional({ enum: MoodLevel })
  @IsEnum(MoodLevel)
  @IsOptional()
  mood?: MoodLevel;

  @ApiPropertyOptional({
    description: 'Start date for summary period',
    example: '2026-01-01',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dateFrom?: Date;

  @ApiPropertyOptional({
    description: 'End date for summary period',
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
}

/**
 * Individual mood count in summary
 */
export class MoodCountDto {
  @ApiPropertyOptional()
  mood!: MoodLevel;

  @ApiPropertyOptional()
  label!: string;

  @ApiPropertyOptional()
  count!: number;

  @ApiPropertyOptional()
  percentage!: number;
}

/**
 * Mood trend data point
 */
export class MoodTrendPointDto {
  @ApiPropertyOptional()
  date!: string;

  @ApiPropertyOptional()
  avgMood!: number;

  @ApiPropertyOptional()
  entryCount!: number;
}

/**
 * Mood summary response
 */
export class MoodSummaryResponseDto {
  @ApiPropertyOptional()
  totalEntries!: number;

  @ApiPropertyOptional()
  entriesWithMood!: number;

  @ApiPropertyOptional()
  averageMood!: number | null;

  @ApiPropertyOptional({ type: [MoodCountDto] })
  moodDistribution!: MoodCountDto[];

  @ApiPropertyOptional({ type: [MoodTrendPointDto] })
  trend!: MoodTrendPointDto[];

  @ApiPropertyOptional()
  periodStart!: Date;

  @ApiPropertyOptional()
  periodEnd!: Date;
}
