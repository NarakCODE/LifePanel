import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { MoodLevel } from '../schemas/journal-entry.schema';

@Exclude()
export class JournalEntryResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty({ required: false, nullable: true })
  workspaceId?: string | null;

  @Expose()
  @ApiProperty()
  userId!: string;

  @Expose()
  @ApiProperty({ required: false, nullable: true })
  authorUserId?: string | null;

  @Expose()
  @ApiProperty({ required: false, nullable: true })
  updatedBy?: string | null;

  @Expose()
  @ApiProperty()
  entryDate!: Date;

  @Expose()
  @ApiProperty()
  title?: string;

  @Expose()
  @ApiProperty()
  content!: string;

  @Expose()
  @ApiProperty({ enum: MoodLevel })
  mood?: MoodLevel;

  @Expose()
  @ApiProperty({ type: [String] })
  tags!: string[];

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  @Expose()
  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<JournalEntryResponseDto>) {
    Object.assign(this, partial);
  }
}
