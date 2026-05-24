import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  Max,
  MaxLength,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HabitFrequency } from '../schemas/habit.schema';

export class CreateHabitDto {
  @ApiProperty({ example: 'Morning Exercise' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: '30 minutes of cardio' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: HabitFrequency, default: HabitFrequency.DAILY })
  @IsEnum(HabitFrequency)
  @IsOptional()
  frequency?: HabitFrequency;

  @ApiPropertyOptional({
    example: [1, 2, 3, 4, 5],
    description: 'Days of week (0=Sun, 6=Sat) for CUSTOM frequency',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @IsOptional()
  customDays?: number[];

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  targetCount?: number;

  @ApiPropertyOptional({ example: '#22c55e', default: '#6b7280' })
  @IsString()
  @MaxLength(7)
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({
    example: '2026-03-22T00:00:00Z',
    default: 'current date',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ example: '2026-04-22T00:00:00Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}
