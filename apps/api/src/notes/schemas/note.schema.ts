import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NoteDocument = HydratedDocument<Note>;

export enum NoteType {
  GENERAL = 'general',
  MEETING = 'meeting',
  AUDIO = 'audio',
}

export enum NoteStatus {
  COMPLETED = 'completed',
  PROCESSING = 'processing',
}

@Schema({ _id: false, timestamps: false })
export class NoteAuthorSnapshot {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  id!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  avatarUrl?: string;
}

export const NoteAuthorSnapshotSchema =
  SchemaFactory.createForClass(NoteAuthorSnapshot);

@Schema({ timestamps: true, collection: 'notes' })
export class Note {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', default: null, index: true })
  workspaceId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  updatedBy?: Types.ObjectId | null;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  content?: string;

  @Prop({
    required: true,
    enum: Object.values(NoteType),
    default: NoteType.GENERAL,
    index: true,
  })
  noteType!: NoteType;

  @Prop({
    required: true,
    enum: Object.values(NoteStatus),
    default: NoteStatus.COMPLETED,
    index: true,
  })
  status!: NoteStatus;

  // Project reference for project-scoped notes
  @Prop({ required: true, trim: true, index: true })
  projectId!: string;

  @Prop({ trim: true })
  projectName?: string;

  // Audio-specific fields
  @Prop({ trim: true })
  audioUrl?: string;

  @Prop({ trim: true })
  audioDuration?: string;

  // Denormalized author info for quick access
  @Prop({ type: NoteAuthorSnapshotSchema, default: null })
  author?: NoteAuthorSnapshot | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const NoteSchema = SchemaFactory.createForClass(Note);

// Indexes for common queries
NoteSchema.index({ userId: 1, projectId: 1 });
NoteSchema.index({ workspaceId: 1, projectId: 1 });
NoteSchema.index({ userId: 1, noteType: 1 });
NoteSchema.index({ workspaceId: 1, noteType: 1 });
NoteSchema.index({ userId: 1, status: 1 });
NoteSchema.index({ workspaceId: 1, status: 1 });
NoteSchema.index({ userId: 1, createdAt: -1 });
NoteSchema.index({ workspaceId: 1, createdAt: -1 });
NoteSchema.index({ userId: 1, updatedAt: -1 });
NoteSchema.index({ workspaceId: 1, updatedAt: -1 });
