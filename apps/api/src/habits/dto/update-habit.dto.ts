import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateHabitDto } from './create-habit.dto';
import { IsOptional, IsEnum } from 'class-validator';

export class UpdateHabitDto extends PartialType(CreateHabitDto) {
  @ApiPropertyOptional({ enum: ['active', 'archived'] })
  @IsEnum(['active', 'archived'])
  @IsOptional()
  status?: string;
}
