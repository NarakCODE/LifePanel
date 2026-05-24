import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TaskDependencyType,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '../schemas/task.schema';

export class TaskChecklistItemInputDto {
  @ApiProperty({ example: 'Confirm acceptance criteria' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  text!: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  checked?: boolean;
}

export class TaskChecklistInputDto {
  @ApiProperty({ example: 'Launch checklist' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({ type: [TaskChecklistItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskChecklistItemInputDto)
  @IsOptional()
  items?: TaskChecklistItemInputDto[];
}

export class TaskCommentInputDto {
  @ApiProperty({ example: 'Please review @alex before launch.' })
  @IsString()
  @IsNotEmpty()
  markdown!: string;

  @ApiPropertyOptional({
    description: 'Mentioned user ids.',
    type: [String],
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  mentionIds?: string[];
}

export class TaskCustomFieldInputDto {
  @ApiProperty({ example: 'storyPoints' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key!: string;

  @ApiPropertyOptional({ example: 'Story points' })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  label?: string;

  @ApiPropertyOptional({ example: 'number' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  type?: string;

  @ApiPropertyOptional({
    description: 'Custom field value. Supports primitive values or objects.',
  })
  @IsOptional()
  value?: unknown;
}

export class TaskDependencyInputDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  taskId!: string;

  @ApiProperty({ enum: TaskDependencyType })
  @IsEnum(TaskDependencyType)
  type!: TaskDependencyType;
}

export class CreateTaskDto {
  @ApiProperty({ example: 'Design system setup' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: 'project-fintech-redesign' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  projectId!: string;

  @ApiPropertyOptional({ example: 'ws-discovery' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  workstreamId?: string;

  @ApiPropertyOptional({
    description: 'Assignee user id. When provided the API resolves the user.',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({
    description: 'Multiple assignee user ids. Supersedes assigneeId.',
    type: [String],
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  assigneeIds?: string[];

  @ApiPropertyOptional({
    description: 'Watcher user ids.',
    type: [String],
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  watcherIds?: string[];

  @ApiPropertyOptional({
    example: 'Establish the token and spacing system.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: '## Scope\nImplement API support for richer tasks.',
  })
  @IsString()
  @IsOptional()
  markdownDescription?: string;

  @ApiPropertyOptional({
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({
    enum: TaskPriority,
    default: TaskPriority.NONE,
  })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({
    enum: TaskType,
    default: TaskType.TASK,
  })
  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @ApiPropertyOptional({ example: 'Design' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  tag?: string;

  @ApiPropertyOptional({
    description: 'Task tags. Supersedes tag.',
    example: ['Design', 'Launch'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ example: '2026-03-25T00:00:00Z' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({
    example: '2026-03-27T00:00:00Z',
    description:
      'Optional scheduling field kept for dashboard overview compatibility.',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;

  @ApiPropertyOptional({ example: '2026-03-27T17:30:00Z' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDateTime?: Date;

  @ApiPropertyOptional({ example: 240, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  timeEstimateMinutes?: number;

  @ApiPropertyOptional({ example: 90, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  timeSpentMinutes?: number;

  @ApiPropertyOptional({
    description: 'Parent task id for subtasks.',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsOptional()
  parentTaskId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  subtaskIds?: string[];

  @ApiPropertyOptional({ type: [TaskChecklistInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskChecklistInputDto)
  @IsOptional()
  checklists?: TaskChecklistInputDto[];

  @ApiPropertyOptional({ type: [TaskCommentInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskCommentInputDto)
  @IsOptional()
  comments?: TaskCommentInputDto[];

  @ApiPropertyOptional({ type: [TaskCustomFieldInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskCustomFieldInputDto)
  @IsOptional()
  customFields?: TaskCustomFieldInputDto[];

  @ApiPropertyOptional({ type: [TaskDependencyInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskDependencyInputDto)
  @IsOptional()
  dependencies?: TaskDependencyInputDto[];
}
