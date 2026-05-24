import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { GoalStatus, GoalType } from '../schemas/goal.schema';

@Exclude()
export class ProgressLogResponseDto {
  @Expose()
  @ApiProperty()
  value!: number;

  @Expose()
  @ApiProperty()
  note?: string;

  @Expose()
  @ApiProperty()
  loggedAt!: Date;
}

@Exclude()
export class GoalResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  workspaceId?: string | null;

  @Expose()
  @ApiProperty()
  userId!: string;

  @Expose()
  @ApiProperty()
  title!: string;

  @Expose()
  @ApiProperty()
  description?: string;

  @Expose()
  @ApiProperty({ enum: GoalType })
  type!: GoalType;

  @Expose()
  @ApiProperty()
  targetValue!: number;

  @Expose()
  @ApiProperty()
  currentValue!: number;

  @Expose()
  @ApiProperty()
  unit?: string;

  @Expose()
  @ApiProperty()
  dueDate?: Date;

  @Expose()
  @ApiProperty({ enum: GoalStatus })
  status!: GoalStatus;

  @Expose()
  @ApiProperty({ type: [ProgressLogResponseDto] })
  progressLogs!: ProgressLogResponseDto[];

  @Expose()
  @ApiProperty({ type: [String] })
  linkedTasks!: string[];

  @Expose()
  @ApiProperty({ type: [String] })
  linkedHabits!: string[];

  @Expose()
  @ApiProperty()
  progressPercent!: number;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  @Expose()
  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<GoalResponseDto>) {
    Object.assign(this, partial);
  }
}
