import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { MessageType } from '../schemas/message.schema';

export class SendMessageDto {
  @ApiProperty({ description: 'List of recipient user IDs' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  recipientIds!: string[];

  @ApiProperty({ description: 'Subject of the message' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  subject!: string;

  @ApiProperty({ description: 'Body of the message' })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional({ description: 'Rich content JSON from editor' })
  @IsOptional()
  contentJson?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: MessageType })
  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType = MessageType.USER_MESSAGE;

  @ApiPropertyOptional({ description: 'ID of the message being replied to' })
  @IsMongoId()
  @IsOptional()
  replyToId?: string;

  @ApiPropertyOptional({ description: 'Custom metadata' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class SendAnnouncementDto {
  @ApiProperty({ description: 'Subject of the announcement' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  subject!: string;

  @ApiProperty({ description: 'Body of the announcement' })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional({ description: 'Rich content JSON from editor' })
  @IsOptional()
  contentJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Custom metadata' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
