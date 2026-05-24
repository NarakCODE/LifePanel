import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetPeriod, BudgetHealth } from '../schemas/budget.schema';

@Exclude()
export class BudgetResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  workspaceId?: string | null;

  @Expose()
  @ApiProperty()
  userId!: string;

  @Expose()
  @ApiProperty()
  name!: string;

  @Expose()
  @ApiProperty()
  amount!: number;

  @Expose()
  @ApiProperty()
  category?: string;

  @Expose()
  @ApiProperty({ enum: BudgetPeriod })
  period!: BudgetPeriod;

  @Expose()
  @ApiProperty()
  startDate?: Date;

  @Expose()
  @ApiProperty()
  endDate?: Date;

  @Expose()
  @ApiProperty()
  currency!: string;

  @Expose()
  @ApiProperty()
  isActive!: boolean;

  @Expose()
  @ApiProperty()
  description?: string;

  @Expose()
  @ApiProperty()
  color?: string;

  @Expose()
  @ApiProperty()
  alertThreshold?: number;

  @Expose()
  @ApiProperty({ type: [String] })
  tags?: string[];

  @Expose()
  @ApiProperty()
  parentBudgetId?: string | null;

  @Expose()
  @ApiProperty()
  isArchived?: boolean;

  @Expose()
  @ApiProperty()
  archivedAt?: Date;

  @Expose()
  @ApiProperty()
  actualSpending?: number;

  @Expose()
  @ApiProperty()
  remainingAmount?: number;

  @Expose()
  @ApiProperty()
  percentUsed?: number;

  @Expose()
  @ApiProperty()
  isOverBudget?: boolean;

  @Expose()
  @ApiProperty({ enum: BudgetHealth })
  health?: BudgetHealth;

  @Expose()
  @ApiProperty()
  alertTriggered?: boolean;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  @Expose()
  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<BudgetResponseDto>) {
    Object.assign(this, partial);
  }
}
