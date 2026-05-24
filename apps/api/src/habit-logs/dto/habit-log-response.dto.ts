import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class HabitLogResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  workspaceId?: string | null;

  @Expose()
  @ApiProperty()
  habitId!: string;

  @Expose()
  @ApiProperty()
  userId!: string;

  @Expose()
  @ApiProperty()
  loggedDate!: Date;

  @Expose()
  @ApiProperty()
  count!: number;

  @Expose()
  @ApiProperty()
  notes?: string;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  @Expose()
  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<HabitLogResponseDto>) {
    Object.assign(this, partial);
  }
}
