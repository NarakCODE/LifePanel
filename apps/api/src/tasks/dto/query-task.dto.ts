import {
  IsArray,
  IsDate,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { TaskPriority, TaskStatus, TaskType } from '../schemas/task.schema';

export enum TasksView {
  LIST = 'list',
  BOARD = 'board',
  TIMELINE = 'timeline',
}

export enum TasksGroupBy {
  NONE = 'none',
  STATUS = 'status',
  ASSIGNEE = 'assignee',
  TAGS = 'tags',
}

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

export class QueryTaskDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: TaskStatus,
    isArray: true,
    description: 'Filter by task status.',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(TaskStatus, { each: true })
  @Transform(({ value }) => toStringArray(value))
  status?: TaskStatus[];

  @ApiPropertyOptional({
    enum: TaskPriority,
    description: 'Filter by priority',
  })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({
    enum: TaskType,
    description: 'Filter by task type',
  })
  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @ApiPropertyOptional({
    description: 'Filter tasks starting from this scheduled date',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDateFrom?: Date;

  @ApiPropertyOptional({
    description: 'Filter tasks ending at this scheduled date',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDateTo?: Date;

  @ApiPropertyOptional({
    description: 'Filter by tags (comma separated)',
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => toStringArray(value))
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Filter by assignee ids (comma separated)',
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @Transform(({ value }) => toStringArray(value))
  assigneeIds?: string[];

  @ApiPropertyOptional({
    description: 'Filter tasks to a single project.',
    example: 'project-fintech-redesign',
  })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Filter subtasks by parent task id.',
  })
  @IsOptional()
  @IsMongoId()
  parentTaskId?: string;

  @ApiPropertyOptional({
    enum: TasksView,
    description: 'Frontend hint for the requested task view.',
  })
  @IsOptional()
  @IsEnum(TasksView)
  view?: TasksView;

  @ApiPropertyOptional({
    enum: TasksGroupBy,
    description: 'Frontend hint for grouping the returned tasks.',
  })
  @IsOptional()
  @IsEnum(TasksGroupBy)
  groupBy?: TasksGroupBy;
}
