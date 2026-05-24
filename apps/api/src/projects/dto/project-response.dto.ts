import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { ProjectPriority, ProjectStatus } from '../schemas/project.schema';

@Exclude()
export class ProjectWorkstreamResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  name!: string;

  @Expose()
  @ApiProperty()
  order!: number;

  constructor(partial: Partial<ProjectWorkstreamResponseDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class ProjectResponseDto {
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
  @Type(() => ProjectWorkstreamResponseDto)
  @ApiProperty({ type: [ProjectWorkstreamResponseDto] })
  workstreams!: ProjectWorkstreamResponseDto[];

  constructor(partial: Partial<ProjectResponseDto>) {
    Object.assign(this, partial);
  }
}

export type ResolvedTaskProjectContext = {
  projectId: string;
  projectName: string;
  workstreamId?: string;
  workstreamName?: string;
};
