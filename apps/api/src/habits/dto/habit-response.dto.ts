import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HabitFrequency } from '../schemas/habit.schema';

@Exclude()
export class HabitResponseDto {
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
  createdBy!: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  updatedBy?: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  archivedBy?: string | null;

  @Expose()
  @ApiProperty()
  name!: string;

  @Expose()
  @ApiPropertyOptional()
  description?: string;

  @Expose()
  @ApiProperty({ enum: HabitFrequency })
  frequency!: HabitFrequency;

  @Expose()
  @ApiProperty()
  customDays!: number[];

  @Expose()
  @ApiProperty()
  targetCount!: number;

  @Expose()
  @ApiProperty()
  color!: string;

  @Expose()
  @ApiProperty({ enum: ['active', 'archived'] })
  status!: string;

  @Expose()
  @ApiProperty()
  startDate!: Date;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  endDate?: Date | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  archivedAt?: Date | null;

  @Expose()
  @ApiProperty()
  currentStreak!: number;

  @Expose()
  @ApiProperty()
  longestStreak!: number;

  @Expose()
  @ApiProperty()
  isActive!: boolean;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  @Expose()
  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<HabitResponseDto>) {
    Object.assign(this, partial);
  }
}
