import { IsOptional, IsEnum, IsBoolean, IsString, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { BudgetPeriod } from '../schemas/budget.schema';

export class QueryBudgetDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: BudgetPeriod })
  @IsEnum(BudgetPeriod)
  @IsOptional()
  period?: BudgetPeriod;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return value === 'true' || value === true;
  })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return value === 'true' || value === true;
  })
  @IsOptional()
  isArchived?: boolean;

  @ApiPropertyOptional({ type: [String], example: 'essential,recurring' })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    return Array.isArray(value) ? value : value.split(',');
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Filter by parent budget ID' })
  @IsString()
  @IsOptional()
  parentBudgetId?: string;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['name', 'amount', 'percentUsed', 'createdAt', 'updatedAt'] })
  @IsString()
  @IsOptional()
  sortBy?: string;
}
