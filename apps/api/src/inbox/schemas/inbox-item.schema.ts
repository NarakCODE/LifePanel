import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InboxItemDocument = HydratedDocument<InboxItem>;

@Schema({ timestamps: true, collection: 'inbox_items' })
export class InboxItem {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message', required: true, index: true })
  messageId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', default: null, index: true })
  workspaceId?: Types.ObjectId | null;

  @Prop({ default: false, index: true })
  isRead!: boolean;

  @Prop({ default: false, index: true })
  isArchived!: boolean;

  @Prop({ type: Date, default: null, index: true })
  snoozedUntil!: Date | null;

  @Prop({ type: [String], default: [] })
  labels!: string[];

  @Prop({ type: Date, default: null })
  readAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const InboxItemSchema = SchemaFactory.createForClass(InboxItem);

InboxItemSchema.index({ userId: 1, isArchived: 1, snoozedUntil: 1, createdAt: -1 });
