import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  WorkspaceType,
  WorkspaceStatus,
  WorkspaceRole,
} from '../schemas/workspace.schema';

@Exclude()
export class WorkspaceUserDetailsDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  email!: string;

  @Expose()
  @ApiProperty()
  displayName!: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  avatarUrl?: string | null;

  constructor(partial: Partial<WorkspaceUserDetailsDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class WorkspaceMemberResponseDto {
  @Expose()
  @ApiProperty()
  userId!: string;

  @Expose()
  @ApiProperty({ enum: WorkspaceRole })
  role!: WorkspaceRole;

  @Expose()
  @Type(() => WorkspaceUserDetailsDto)
  @ApiProperty({ type: WorkspaceUserDetailsDto })
  user!: WorkspaceUserDetailsDto;

  constructor(partial: Partial<WorkspaceMemberResponseDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class WorkspaceResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  name!: string;

  @Expose()
  @ApiProperty({ enum: WorkspaceType })
  type!: WorkspaceType;

  @Expose()
  @ApiProperty({ enum: WorkspaceStatus })
  status!: WorkspaceStatus;

  @Expose()
  @ApiProperty()
  ownerId!: string;

  @Expose()
  @Type(() => WorkspaceUserDetailsDto)
  @ApiProperty({ type: WorkspaceUserDetailsDto })
  owner!: WorkspaceUserDetailsDto;

  @Expose()
  @ApiProperty()
  createdById!: string;

  @Expose()
  @Type(() => WorkspaceUserDetailsDto)
  @ApiProperty({ type: WorkspaceUserDetailsDto })
  createdBy!: WorkspaceUserDetailsDto;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  defaultForUserId?: string | null;

  @Expose()
  @Type(() => WorkspaceMemberResponseDto)
  @ApiProperty({ type: [WorkspaceMemberResponseDto] })
  members!: WorkspaceMemberResponseDto[];

  @Expose()
  @ApiProperty()
  createdAt!: string;

  @Expose()
  @ApiProperty()
  updatedAt!: string;

  constructor(partial: Partial<WorkspaceResponseDto>) {
    Object.assign(this, partial);
  }
}
