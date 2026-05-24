import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MoveProjectTaskDto {
  @ApiPropertyOptional({
    description:
      'Destination workstream id. Omit to move the task out of a lane.',
    example: '67e0dc5a5bb2a40dc6e3c001',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  targetWorkstreamId?: string;

  @ApiPropertyOptional({
    description:
      'Zero-based insertion order inside the destination workstream.',
    example: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  targetOrder?: number;
}
