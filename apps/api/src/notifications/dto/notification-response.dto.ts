import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../schemas/notification.schema';

@Exclude()
export class NotificationResponseDto {
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
  recipientUserId?: string | null;

  @Expose()
  @ApiProperty({ required: false, nullable: true })
  createdBy?: string | null;

  @Expose()
  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @Expose()
  @ApiProperty()
  title!: string;

  @Expose()
  @ApiProperty()
  body!: string;

  @Expose()
  @ApiProperty()
  data!: Record<string, unknown>;

  @Expose()
  @ApiProperty()
  isRead!: boolean;

  @Expose()
  @ApiProperty({ nullable: true })
  readAt!: Date | null;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  @Expose()
  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<NotificationResponseDto>) {
    Object.assign(this, partial);
  }
}
