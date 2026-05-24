import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_DUE = 'task_due',
  HABIT_REMINDER = 'habit_reminder',
  GOAL_MILESTONE = 'goal_milestone',
  BUDGET_ALERT = 'budget_alert',
  PROJECT_MENTION = 'project_mention',
  WORKSPACE_INVITATION = 'workspace_invitation',
  COMMENT_REPLY = 'comment_reply',
  ISSUE_ASSIGNED = 'issue_assigned',
  ISSUE_UPDATED = 'issue_updated',
  SYSTEM = 'system',
}

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', default: null, index: true })
  workspaceId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  recipientUserId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  createdBy?: Types.ObjectId | null;

  @Prop({ required: true, enum: Object.values(NotificationType) })
  type!: NotificationType;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  body!: string;

  @Prop({ type: Object, default: {} })
  data!: Record<string, unknown>;

  @Prop({ default: false, index: true })
  isRead!: boolean;

  @Prop({ type: Date, default: null })
  readAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({
  workspaceId: 1,
  recipientUserId: 1,
  isRead: 1,
  createdAt: -1,
});
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 },
);
