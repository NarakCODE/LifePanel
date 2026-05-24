import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDate,
  IsNumber,
  Min,
  Max,
  MaxLength,
  IsArray,
  IsHexColor,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetPeriod } from '../schemas/budget.schema';

export class CreateBudgetDto {
  @ApiProperty({ example: 'Monthly Groceries' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ example: 'food' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ enum: BudgetPeriod, default: BudgetPeriod.MONTHLY })
  @IsEnum(BudgetPeriod)
  @IsOptional()
  period?: BudgetPeriod;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00Z' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2026-03-31T00:00:00Z' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsString()
  @MaxLength(3)
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: 'Budget for monthly grocery shopping' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '#3b82f6', default: '#3b82f6' })
  @IsHexColor()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: 80, default: 80, description: 'Alert threshold percentage (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  alertThreshold?: number;

  @ApiPropertyOptional({ type: [String], example: ['essential', 'recurring'] })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Parent budget ID for sub-budgets' })
  @IsString()
  @IsOptional()
  parentBudgetId?: string;
}
