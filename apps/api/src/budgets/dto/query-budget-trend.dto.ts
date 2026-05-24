import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum TrendGranularity {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export class QueryBudgetTrendDto {
  @ApiPropertyOptional({ enum: TrendGranularity, default: TrendGranularity.DAILY })
  @IsEnum(TrendGranularity)
  @IsOptional()
  granularity?: TrendGranularity;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00Z' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z' })
  @IsString()
  @IsOptional()
  endDate?: string;
}
