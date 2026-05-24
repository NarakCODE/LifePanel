import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDate,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHabitLogDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  habitId!: string;

  @ApiProperty({ example: '2026-03-20T00:00:00Z' })
  @IsDate()
  @Type(() => Date)
  loggedDate!: Date;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  count?: number;

  @ApiPropertyOptional({ example: 'Felt great today!' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;
}
