import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { ProjectPriority, ProjectStatus } from '../schemas/project.schema';
import { TaskPriority, TaskStatus } from '../../tasks/schemas/task.schema';

@Exclude()
export class ProjectDetailsUserDto {
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

  constructor(partial: Partial<ProjectDetailsUserDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class ProjectDetailsMetaDto {
  @Expose()
  @ApiProperty()
  priorityLabel!: string;

  @Expose()
  @ApiProperty()
  locationLabel!: string;

  @Expose()
  @ApiProperty()
  sprintLabel!: string;

  @Expose()
  @ApiProperty()
  lastSyncLabel!: string;

  constructor(partial: Partial<ProjectDetailsMetaDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class ProjectDetailsScopeDto {
  @Expose()
  @ApiProperty({ type: [String] })
  inScope!: string[];

  @Expose()
  @ApiProperty({ type: [String] })
  outOfScope!: string[];

  constructor(partial: Partial<ProjectDetailsScopeDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class ProjectDetailsKeyFeaturesDto {
  @Expose()
  @ApiProperty({ type: [String] })
  p0!: string[];

  @Expose()
  @ApiProperty({ type: [String] })
  p1!: string[];

  @Expose()
  @ApiProperty({ type: [String] })
  p2!: string[];

  constructor(partial: Partial<ProjectDetailsKeyFeaturesDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class ProjectDetailsTimelineTaskDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  name!: string;

  @Expose()
  @ApiProperty()
  startDate!: Date;

  @Expose()
  @ApiProperty()
  endDate!: Date;

  @Expose()
  @ApiProperty({ enum: ['planned', 'in-progress', 'done'] })
  status!: 'planned' | 'in-progress' | 'done';

  constructor(partial: Partial<ProjectDetailsTimelineTaskDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class ProjectDetailsWorkstreamTaskDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  name!: string;

  @Expose()
  @ApiProperty({ enum: TaskStatus })
  status!: TaskStatus;

  @Expose()
  @ApiPropertyOptional()
  dueLabel?: string;

  @Expose()
  @ApiPropertyOptional({ enum: ['danger', 'warning', 'muted'] })
  dueTone?: 'danger' | 'warning' | 'muted';

  @Expose()
  @Type(() => ProjectDetailsUserDto)
  @ApiPropertyOptional({ type: ProjectDetailsUserDto })
  assignee?: ProjectDetailsUserDto;

  @Expose()
  @ApiPropertyOptional()
  startDate?: Date;

  @Expose()
  @ApiPropertyOptional()
  dueDate?: Date;

  @Expose()
  @ApiPropertyOptional({ enum: TaskPriority })
  priority?: TaskPriority;

  @Expose()
  @ApiPropertyOptional()
  tag?: string;

  @Expose()
  @ApiPropertyOptional()
  description?: string;

  @Expose()
  @ApiPropertyOptional()
  order?: number;

  constructor(partial: Partial<ProjectDetailsWorkstreamTaskDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class ProjectDetailsProjectTaskDto extends ProjectDetailsWorkstreamTaskDto {
  @Expose()
  @ApiProperty()
  projectId!: string;

  @Expose()
  @ApiProperty()
  projectName!: string;

  @Expose()
  @ApiProperty()
  workstreamId!: string;

  @Expose()
  @ApiProperty()
  workstreamName!: string;

  constructor(partial: Partial<ProjectDetailsProjectTaskDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@Exclude()
export class ProjectDetailsWorkstreamDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  name!: string;

  @Expose()
  @ApiProperty()
  order!: number;

  @Expose()
  @Type(() => ProjectDetailsWorkstreamTaskDto)
  @ApiProperty({ type: [ProjectDetailsWorkstreamTaskDto] })
  tasks!: ProjectDetailsWorkstreamTaskDto[];

  constructor(partial: Partial<ProjectDetailsWorkstreamDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class ProjectDetailsTimeSummaryDto {
  @Expose()
  @ApiProperty()
  estimateLabel!: string;

  @Expose()
  @ApiProperty()
  dueDate!: Date;

  @Expose()
  @ApiProperty()
  daysRemainingLabel!: string;

  @Expose()
  @ApiProperty()
  progressPercent!: number;

  constructor(partial: Partial<ProjectDetailsTimeSummaryDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class ProjectDetailsBacklogSummaryDto {
  @Expose()
  @ApiProperty({
    enum: ['Active', 'Backlog', 'Planned', 'Completed', 'Cancelled'],
  })
  statusLabel!: 'Active' | 'Backlog' | 'Planned' | 'Completed' | 'Cancelled';

  @Expose()
  @ApiProperty()
  groupLabel!: string;

  @Expose()
  @ApiProperty()
  priorityLabel!: string;

  @Expose()
  @ApiProperty()
  labelBadge!: string;

  @Expose()
  @Type(() => ProjectDetailsUserDto)
  @ApiProperty({ type: [ProjectDetailsUserDto] })
  picUsers!: ProjectDetailsUserDto[];

  @Expose()
  @Type(() => ProjectDetailsUserDto)
  @ApiPropertyOptional({ type: [ProjectDetailsUserDto] })
  supportUsers?: ProjectDetailsUserDto[];

  constructor(partial: Partial<ProjectDetailsBacklogSummaryDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class ProjectDetailsQuickLinkDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  name!: string;

  @Expose()
  @ApiProperty({ enum: ['pdf', 'zip', 'fig', 'doc', 'file'] })
  type!: 'pdf' | 'zip' | 'fig' | 'doc' | 'file';

  @Expose()
  @ApiProperty()
  sizeMB!: number;

  @Expose()
  @ApiProperty()
  url!: string;

  constructor(partial: Partial<ProjectDetailsQuickLinkDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class ProjectDetailsFileDto extends ProjectDetailsQuickLinkDto {
  @Expose()
  @Type(() => ProjectDetailsUserDto)
  @ApiProperty({ type: ProjectDetailsUserDto })
  addedBy!: ProjectDetailsUserDto;

  @Expose()
  @ApiProperty()
  addedDate!: Date;

  @Expose()
  @ApiPropertyOptional()
  description?: string;

  @Expose()
  @ApiPropertyOptional()
  isLinkAsset?: boolean;

  @Expose()
  @Type(() => ProjectDetailsQuickLinkDto)
  @ApiPropertyOptional({ type: [ProjectDetailsQuickLinkDto] })
  attachments?: ProjectDetailsQuickLinkDto[];

  constructor(partial: Partial<ProjectDetailsFileDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@Exclude()
export class ProjectDetailsTranscriptSegmentDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  speaker!: string;

  @Expose()
  @ApiProperty()
  timestamp!: string;

  @Expose()
  @ApiProperty()
  text!: string;

  constructor(partial: Partial<ProjectDetailsTranscriptSegmentDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class ProjectDetailsAudioNoteDataDto {
  @Expose()
  @ApiProperty()
  duration!: string;

  @Expose()
  @ApiProperty()
  fileName!: string;

  @Expose()
  @ApiProperty()
  aiSummary!: string;

  @Expose()
  @ApiProperty({ type: [String] })
  keyPoints!: string[];

  @Expose()
  @ApiProperty({ type: [String] })
  insights!: string[];

  @Expose()
  @Type(() => ProjectDetailsTranscriptSegmentDto)
  @ApiProperty({ type: [ProjectDetailsTranscriptSegmentDto] })
  transcript!: ProjectDetailsTranscriptSegmentDto[];

  constructor(partial: Partial<ProjectDetailsAudioNoteDataDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class ProjectDetailsNoteDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  title!: string;

  @Expose()
  @ApiPropertyOptional()
  content?: string;

  @Expose()
  @ApiProperty({ enum: ['general', 'meeting', 'audio'] })
  noteType!: 'general' | 'meeting' | 'audio';

  @Expose()
  @ApiProperty({ enum: ['completed', 'processing'] })
  status!: 'completed' | 'processing';

  @Expose()
  @ApiProperty()
  addedDate!: Date;

  @Expose()
  @Type(() => ProjectDetailsUserDto)
  @ApiProperty({ type: ProjectDetailsUserDto })
  addedBy!: ProjectDetailsUserDto;

  @Expose()
  @Type(() => ProjectDetailsAudioNoteDataDto)
  @ApiPropertyOptional({ type: ProjectDetailsAudioNoteDataDto })
  audioData?: ProjectDetailsAudioNoteDataDto;

  constructor(partial: Partial<ProjectDetailsNoteDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class ProjectDetailsResponseDto {
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
  @ApiProperty({ enum: ProjectStatus })
  status!: ProjectStatus;

  @Expose()
  @ApiProperty({ enum: ProjectPriority })
  priority!: ProjectPriority;

  @Expose()
  @ApiPropertyOptional()
  typeLabel?: string;

  @Expose()
  @ApiPropertyOptional()
  durationLabel?: string;

  @Expose()
  @ApiProperty()
  description!: string;

  @Expose()
  @Type(() => ProjectDetailsMetaDto)
  @ApiProperty({ type: ProjectDetailsMetaDto })
  meta!: ProjectDetailsMetaDto;

  @Expose()
  @Type(() => ProjectDetailsScopeDto)
  @ApiProperty({ type: ProjectDetailsScopeDto })
  scope!: ProjectDetailsScopeDto;

  @Expose()
  @ApiProperty({ type: [String] })
  outcomes!: string[];

  @Expose()
  @Type(() => ProjectDetailsKeyFeaturesDto)
  @ApiProperty({ type: ProjectDetailsKeyFeaturesDto })
  keyFeatures!: ProjectDetailsKeyFeaturesDto;

  @Expose()
  @Type(() => ProjectDetailsTimelineTaskDto)
  @ApiProperty({ type: [ProjectDetailsTimelineTaskDto] })
  timelineTasks!: ProjectDetailsTimelineTaskDto[];

  @Expose()
  @Type(() => ProjectDetailsWorkstreamDto)
  @ApiProperty({ type: [ProjectDetailsWorkstreamDto] })
  workstreams!: ProjectDetailsWorkstreamDto[];

  @Expose()
  @Type(() => ProjectDetailsProjectTaskDto)
  @ApiProperty({ type: [ProjectDetailsProjectTaskDto] })
  projectTasks!: ProjectDetailsProjectTaskDto[];

  @Expose()
  @Type(() => ProjectDetailsTimeSummaryDto)
  @ApiProperty({ type: ProjectDetailsTimeSummaryDto })
  time!: ProjectDetailsTimeSummaryDto;

  @Expose()
  @Type(() => ProjectDetailsBacklogSummaryDto)
  @ApiProperty({ type: ProjectDetailsBacklogSummaryDto })
  backlog!: ProjectDetailsBacklogSummaryDto;

  @Expose()
  @Type(() => ProjectDetailsQuickLinkDto)
  @ApiProperty({ type: [ProjectDetailsQuickLinkDto] })
  quickLinks!: ProjectDetailsQuickLinkDto[];

  @Expose()
  @Type(() => ProjectDetailsFileDto)
  @ApiProperty({ type: [ProjectDetailsFileDto] })
  files!: ProjectDetailsFileDto[];

  @Expose()
  @Type(() => ProjectDetailsNoteDto)
  @ApiProperty({ type: [ProjectDetailsNoteDto] })
  notes!: ProjectDetailsNoteDto[];

  constructor(partial: Partial<ProjectDetailsResponseDto>) {
    Object.assign(this, partial);
  }
}
