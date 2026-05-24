import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryInboxDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by read status' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isRead?: boolean;

  @ApiPropertyOptional({ description: 'Filter by archived status' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isArchived?: boolean = false;

  @ApiPropertyOptional({ description: 'Filter by label' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ description: 'Search in subject or body' })
  @IsString()
  @IsOptional()
  search?: string;
}

export class UpdateInboxItemDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @ApiPropertyOptional({ description: 'Snooze until date' })
  @IsDateString()
  @IsOptional()
  snoozedUntil?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsString({ each: true })
  @IsOptional()
  labels?: string[];
}

export class InboxItemResponseDto {
  id!: string;
  messageId!: string;
  subject!: string;
  body!: string;
  senderId!: string;
  senderName?: string;
  type!: string;
  isRead!: boolean;
  isArchived!: boolean;
  snoozedUntil!: Date | null;
  labels!: string[];
  createdAt!: Date;

  constructor(partial: Partial<InboxItemResponseDto>) {
    Object.assign(this, partial);
  }
}
