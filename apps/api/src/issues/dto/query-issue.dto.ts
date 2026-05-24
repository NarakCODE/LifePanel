import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { IssuePriority, IssueStatus, IssueType } from '../schemas/issue.schema';

function toStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) =>
        typeof item === 'string' ? item.split(',') : [String(item)],
      )
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [String(value)];
}

export enum IssueSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  DUE_DATE = 'dueDate',
  PRIORITY = 'priority',
  IDENTIFIER = 'identifier',
  TITLE = 'title',
}

export class QueryIssueDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: IssueStatus,
    enumName: 'IssueStatus',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(IssueStatus, { each: true })
  @Transform(({ value }) => toStringArray(value))
  status?: IssueStatus[];

  @ApiPropertyOptional({
    enum: IssuePriority,
    enumName: 'IssuePriority',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(IssuePriority, { each: true })
  @Transform(({ value }) => toStringArray(value))
  priority?: IssuePriority[];

  @ApiPropertyOptional({
    enum: IssueType,
    enumName: 'IssueType',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(IssueType, { each: true })
  @Transform(({ value }) => toStringArray(value))
  type?: IssueType[];

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439012' })
  @IsOptional()
  @IsMongoId()
  cycleId?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Comma-separated assignee ids',
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @Transform(({ value }) => toStringArray(value))
  assigneeIds?: string[];

  @ApiPropertyOptional({
    type: String,
    description: 'Comma-separated labels',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => toStringArray(value))
  labels?: string[];

  @ApiPropertyOptional({
    enum: IssueSortBy,
    enumName: 'IssueSortBy',
    default: IssueSortBy.UPDATED_AT,
  })
  @IsOptional()
  @IsEnum(IssueSortBy)
  override sortBy: IssueSortBy = IssueSortBy.UPDATED_AT;
}
