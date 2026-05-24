import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for marking notifications as read or unread.
 */
export class MarkAsReadDto {
  @ApiPropertyOptional({
    description: 'Mark as read (true) or unread (false)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean = true;
}
