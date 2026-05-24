import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

export enum MessageType {
  USER_MESSAGE = 'user_message',
  ANNOUNCEMENT = 'announcement',
  SYSTEM = 'system',
}

@Schema({ timestamps: true, collection: 'inbox_messages' })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  senderId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', default: null, index: true })
  workspaceId?: Types.ObjectId | null;

  @Prop({ required: true, trim: true })
  subject!: string;

  @Prop({ required: true, trim: true })
  body!: string;

  @Prop({ type: Object, default: null })
  contentJson?: Record<string, unknown> | null;

  @Prop({ required: true, enum: Object.values(MessageType) })
  type!: MessageType;

  @Prop({ type: Types.ObjectId, ref: 'Message', default: null, index: true })
  threadId?: Types.ObjectId | null;

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, unknown>;

  createdAt!: Date;
  updatedAt!: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
