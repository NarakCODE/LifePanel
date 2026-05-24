import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateHabitLogDto {
  @ApiPropertyOptional({ example: '2026-03-20T00:00:00Z' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  loggedDate?: Date;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
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
