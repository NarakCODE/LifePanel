import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PerformanceQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by project ID',
    example: '1',
    default: 'all',
  })
  @IsOptional()
  @IsString()
  projectId?: string = 'all';

  @ApiPropertyOptional({
    description: 'Filter by member assignee',
    example: 'JD',
    default: 'all',
  })
  @IsOptional()
  @IsString()
  member?: string = 'all';

  @ApiPropertyOptional({
    description: 'Start date (ISO format)',
    example: '2024-01-16',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO format)',
    example: '2024-01-23',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
