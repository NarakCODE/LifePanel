import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class DashboardQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for filtering activity/metrics',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering activity/metrics',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
