import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IssuePriority, IssueStatus, IssueType } from '../schemas/issue.schema';

@Exclude()
export class IssueResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  workspaceId!: string;

  @Expose()
  @ApiProperty()
  identifier!: string;

  @Expose()
  @ApiProperty()
  title!: string;

  @Expose()
  @ApiPropertyOptional()
  description?: string | null;

  @Expose()
  @ApiProperty({ enum: IssueStatus, enumName: 'IssueStatus' })
  status!: IssueStatus;

  @Expose()
  @ApiProperty({ enum: IssuePriority, enumName: 'IssuePriority' })
  priority!: IssuePriority;

  @Expose()
  @ApiProperty({ enum: IssueType, enumName: 'IssueType' })
  type!: IssueType;

  @Expose()
  @ApiPropertyOptional()
  projectId?: string | null;

  @Expose()
  @ApiPropertyOptional()
  cycleId?: string | null;

  @Expose()
  @ApiPropertyOptional()
  assigneeId?: string | null;

  @Expose()
  @ApiProperty()
  reporterId!: string;

  @Expose()
  @ApiProperty({ type: [String] })
  labels!: string[];

  @Expose()
  @ApiPropertyOptional()
  dueDate?: Date | null;

  @Expose()
  @ApiPropertyOptional()
  completedAt?: Date | null;

  @Expose()
  @ApiPropertyOptional()
  archivedAt?: Date | null;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  @Expose()
  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<IssueResponseDto>) {
    Object.assign(this, partial);
  }
}

export class IssuePaginationDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class IssueListDataDto {
  @ApiProperty({ type: [IssueResponseDto] })
  issues!: IssueResponseDto[];

  @ApiProperty({ type: IssuePaginationDto })
  pagination!: IssuePaginationDto;
}

export class IssueListResultDto {
  @ApiProperty({ type: IssueListDataDto })
  data!: IssueListDataDto;
}
