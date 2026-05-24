import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateBudgetDto } from './create-budget.dto';
import { IsOptional, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBudgetDto extends PartialType(CreateBudgetDto) {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @ApiPropertyOptional({ example: '2026-05-19T07:00:00Z' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  archivedAt?: Date;
}
