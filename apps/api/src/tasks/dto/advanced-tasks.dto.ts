import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsMongoId, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class LogTimeDto {
  @ApiProperty({
    description: 'Duration in minutes',
    minimum: 1,
    example: 60,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationMin!: number;

  @ApiPropertyOptional({
    description: 'Optional description of the work done',
    example: 'Implemented the new REST API endpoints',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateCustomStatusDto {
  @ApiProperty({ description: 'The name of the status', example: 'In Review' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Color hex code', example: '#3498db' })
  @IsString()
  color!: string;

  @ApiProperty({ description: 'The display order', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order!: number;

  @ApiPropertyOptional({
    description: 'Does this status mean the task is completed?',
    example: false,
  })
  @IsOptional()
  isCompletedStatus?: boolean;
}
