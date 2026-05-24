import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { NotificationType } from '../schemas/notification.schema';

/**
 * Query DTO for listing notifications with pagination and filters.
 */
export class QueryNotificationDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: NotificationType,
    description: 'Filter by notification type',
  })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiPropertyOptional({
    description: 'Filter by read status',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  isRead?: boolean;
}
