import { IsDate, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryHabitLogDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsOptional()
  habitId?: string;

  @ApiPropertyOptional({
    description: 'Filter logs from this date onwards',
    example: '2026-03-01T00:00:00Z',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Filter logs up to this date',
    example: '2026-03-31T00:00:00Z',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;
}
