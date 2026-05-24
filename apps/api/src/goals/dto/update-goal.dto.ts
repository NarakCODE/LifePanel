import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateGoalDto } from './create-goal.dto';
import { IsOptional, IsNumber } from 'class-validator';

export class UpdateGoalDto extends PartialType(CreateGoalDto) {
  @ApiPropertyOptional({ example: 25 })
  @IsNumber()
  @IsOptional()
  currentValue?: number;
}
