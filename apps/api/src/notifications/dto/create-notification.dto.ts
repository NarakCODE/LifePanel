import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../schemas/notification.schema';

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({ example: 'Task Due Soon' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @ApiProperty({ example: 'Your task "Complete docs" is due in 1 hour' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  body!: string;

  @ApiPropertyOptional({ example: { taskId: '507f1f77bcf86cd799439011' } })
  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;
}
