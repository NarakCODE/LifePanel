import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { GoalStatus, GoalType } from '../schemas/goal.schema';

export class QueryGoalDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: GoalStatus })
  @IsEnum(GoalStatus)
  @IsOptional()
  status?: GoalStatus;

  @ApiPropertyOptional({ enum: GoalType })
  @IsEnum(GoalType)
  @IsOptional()
  type?: GoalType;
}
