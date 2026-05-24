import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDate,
  IsNumber,
  Min,
  MaxLength,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GoalStatus, GoalType } from '../schemas/goal.schema';

export class CreateGoalDto {
  @ApiProperty({ example: 'Run 100km this month' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Training for the marathon' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  targetValue!: number;

  @ApiPropertyOptional({ example: 'km' })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ enum: GoalType, default: GoalType.MANUAL })
  @IsEnum(GoalType)
  @IsOptional()
  type?: GoalType;

  @ApiPropertyOptional({ example: '2026-03-31T00:00:00Z' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;

  @ApiPropertyOptional({ enum: GoalStatus, default: GoalStatus.ACTIVE })
  @IsEnum(GoalStatus)
  @IsOptional()
  status?: GoalStatus;

  @ApiPropertyOptional({
    type: [String],
    description: 'Optional linked task IDs',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  linkedTasks?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Optional linked habit IDs',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  linkedHabits?: string[];
}
