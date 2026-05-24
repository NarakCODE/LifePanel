import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { HabitFrequency } from '../schemas/habit.schema';

export class QueryHabitDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['active', 'archived'] })
  @IsEnum(['active', 'archived'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ enum: HabitFrequency })
  @IsEnum(HabitFrequency)
  @IsOptional()
  frequency?: HabitFrequency;
}
