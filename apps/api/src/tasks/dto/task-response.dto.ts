import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  TaskActivityAction,
  TaskDependencyType,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '../schemas/task.schema';

@Exclude()
export class TaskAssigneeResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  name!: string;

  @Expose()
  @ApiPropertyOptional()
  avatarUrl?: string;

  @Expose()
  @ApiPropertyOptional()
  role?: string;

  constructor(partial: Partial<TaskAssigneeResponseDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class TaskChecklistItemResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  text!: string;

  @Expose()
  @ApiProperty()
  checked!: boolean;

  @Expose()
  @ApiPropertyOptional()
  completedBy?: string | null;

  @Expose()
  @ApiPropertyOptional()
  completedAt?: Date | null;

  constructor(partial: Partial<TaskChecklistItemResponseDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class TaskChecklistResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  title!: string;

  @Expose()
  @Type(() => TaskChecklistItemResponseDto)
  @ApiProperty({ type: [TaskChecklistItemResponseDto] })
  items!: TaskChecklistItemResponseDto[];

  constructor(partial: Partial<TaskChecklistResponseDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class TaskCommentResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  authorId!: string;

  @Expose()
  @ApiProperty()
  authorName!: string;

  @Expose()
  @ApiProperty()
  markdown!: string;

  @Expose()
  @ApiProperty({ type: [String] })
  mentionIds!: string[];

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  constructor(partial: Partial<TaskCommentResponseDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class TaskCustomFieldResponseDto {
  @Expose()
  @ApiProperty()
  key!: string;

  @Expose()
  @ApiPropertyOptional()
  label?: string;

  @Expose()
  @ApiPropertyOptional()
  type?: string;

  @Expose()
  @ApiPropertyOptional()
  value?: unknown;

  constructor(partial: Partial<TaskCustomFieldResponseDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class TaskDependencyResponseDto {
  @Expose()
  @ApiProperty()
  taskId!: string;

  @Expose()
  @ApiProperty({ enum: TaskDependencyType })
  type!: TaskDependencyType;

  constructor(partial: Partial<TaskDependencyResponseDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class TaskActivityEntryResponseDto {
  @Expose()
  @ApiProperty({ enum: TaskActivityAction })
  action!: TaskActivityAction;

  @Expose()
  @ApiProperty()
  actorId!: string;

  @Expose()
  @ApiPropertyOptional()
  details?: Record<string, unknown>;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  constructor(partial: Partial<TaskActivityEntryResponseDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class TaskResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  workspaceId!: string;

  @Expose()
  @ApiProperty()
  name!: string;

  @Expose()
  @ApiProperty({ enum: TaskStatus })
  status!: TaskStatus;

  @Expose()
  @ApiProperty({ enum: TaskType })
  type!: TaskType;

  @Expose()
  @ApiProperty()
  projectId!: string;

  @Expose()
  @ApiProperty()
  projectName!: string;

  @Expose()
  @ApiPropertyOptional()
  workstreamId?: string;

  @Expose()
  @ApiPropertyOptional()
  workstreamName?: string;

  @Expose()
  @Type(() => TaskAssigneeResponseDto)
  @ApiPropertyOptional({ type: TaskAssigneeResponseDto })
  assignee?: TaskAssigneeResponseDto;

  @Expose()
  @Type(() => TaskAssigneeResponseDto)
  @ApiProperty({ type: [TaskAssigneeResponseDto] })
  assignees!: TaskAssigneeResponseDto[];

  @Expose()
  @Type(() => TaskAssigneeResponseDto)
  @ApiProperty({ type: [TaskAssigneeResponseDto] })
  watchers!: TaskAssigneeResponseDto[];

  @Expose()
  @ApiPropertyOptional()
  startDate?: Date;

  @Expose()
  @ApiPropertyOptional({ enum: TaskPriority })
  priority?: TaskPriority;

  @Expose()
  @ApiPropertyOptional()
  tag?: string;

  @Expose()
  @ApiProperty({ type: [String] })
  tags!: string[];

  @Expose()
  @ApiPropertyOptional()
  description?: string;

  @Expose()
  @ApiPropertyOptional()
  markdownDescription?: string;

  @Expose()
  @ApiPropertyOptional()
  dueDate?: Date;

  @Expose()
  @ApiPropertyOptional()
  dueDateTime?: Date;

  @Expose()
  @ApiProperty()
  timeEstimateMinutes!: number;

  @Expose()
  @ApiProperty()
  timeSpentMinutes!: number;

  @Expose()
  @ApiPropertyOptional()
  parentTaskId?: string | null;

  @Expose()
  @ApiProperty({ type: [String] })
  subtaskIds!: string[];

  @Expose()
  @Type(() => TaskChecklistResponseDto)
  @ApiProperty({ type: [TaskChecklistResponseDto] })
  checklists!: TaskChecklistResponseDto[];

  @Expose()
  @Type(() => TaskCommentResponseDto)
  @ApiProperty({ type: [TaskCommentResponseDto] })
  comments!: TaskCommentResponseDto[];

  @Expose()
  @Type(() => TaskCustomFieldResponseDto)
  @ApiProperty({ type: [TaskCustomFieldResponseDto] })
  customFields!: TaskCustomFieldResponseDto[];

  @Expose()
  @Type(() => TaskDependencyResponseDto)
  @ApiProperty({ type: [TaskDependencyResponseDto] })
  dependencies!: TaskDependencyResponseDto[];

  @Expose()
  @Type(() => TaskActivityEntryResponseDto)
  @ApiProperty({ type: [TaskActivityEntryResponseDto] })
  activity!: TaskActivityEntryResponseDto[];

  @Expose()
  @ApiPropertyOptional()
  completedAt?: Date | null;

  @Expose()
  @ApiPropertyOptional()
  archivedAt?: Date | null;

  @Expose()
  @ApiPropertyOptional()
  archivedBy?: string | null;

  @Expose()
  @ApiPropertyOptional()
  duplicatedFromTaskId?: string | null;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  @Expose()
  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<TaskResponseDto>) {
    Object.assign(this, partial);
  }
}

export class TaskPaginationDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class TaskFilterCountsDto {
  @ApiPropertyOptional({
    additionalProperties: { type: 'number' },
    type: 'object',
  })
  status?: Record<string, number>;

  @ApiPropertyOptional({
    additionalProperties: { type: 'number' },
    type: 'object',
  })
  priority?: Record<string, number>;

  @ApiPropertyOptional({
    additionalProperties: { type: 'number' },
    type: 'object',
  })
  tags?: Record<string, number>;

  @ApiPropertyOptional({
    additionalProperties: { type: 'number' },
    type: 'object',
  })
  members?: Record<string, number>;
}

export class MyTasksDataDto {
  @ApiProperty({ type: [TaskResponseDto] })
  tasks!: TaskResponseDto[];

  @ApiProperty({ type: TaskPaginationDto })
  pagination!: TaskPaginationDto;
}

export class MyTasksMetaDto {
  @ApiProperty({ type: TaskFilterCountsDto })
  filterCounts!: TaskFilterCountsDto;
}

export class MyTasksResultDto {
  @ApiProperty({ type: MyTasksDataDto })
  data!: MyTasksDataDto;

  @ApiProperty({ type: MyTasksMetaDto })
  meta!: MyTasksMetaDto;
}
