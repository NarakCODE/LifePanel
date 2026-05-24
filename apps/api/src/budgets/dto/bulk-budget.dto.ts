import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BulkAction {
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate',
  ARCHIVE = 'archive',
  DELETE = 'delete',
}

export class BulkBudgetDto {
  @ApiProperty({ type: [String], description: 'Array of budget IDs to operate on' })
  @IsArray()
  @IsString({ each: true })
  budgetIds!: string[];

  @ApiProperty({ enum: BulkAction, description: 'Action to perform on all budgets' })
  @IsEnum(BulkAction)
  action!: BulkAction;

  @ApiPropertyOptional({ description: 'Optional update data to apply to all budgets' })
  @IsOptional()
  updateData?: Record<string, any>;
}
