import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDate,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IssuePriority, IssueStatus, IssueType } from '../schemas/issue.schema';

export class UpdateIssueDto {
  @ApiPropertyOptional({ example: 'Fix task drag ordering for backlog view' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    example: 'Dragging between columns can duplicate cards under load.',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    enum: IssueStatus,
    enumName: 'IssueStatus',
  })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @ApiPropertyOptional({
    enum: IssuePriority,
    enumName: 'IssuePriority',
  })
  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @ApiPropertyOptional({
    enum: IssueType,
    enumName: 'IssueType',
  })
  @IsOptional()
  @IsEnum(IssueType)
  type?: IssueType;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439012' })
  @IsOptional()
  @IsMongoId()
  cycleId?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439013' })
  @IsOptional()
  @IsMongoId()
  assigneeId?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['frontend', 'bugfix'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  labels?: string[];

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date | null;

  @ApiPropertyOptional({ example: '2026-06-02T00:00:00.000Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  completedAt?: Date | null;

  @ApiPropertyOptional({ example: '2026-06-03T00:00:00.000Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  archivedAt?: Date | null;
}
