import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type JournalEntryDocument = HydratedDocument<JournalEntry>;

export enum MoodLevel {
  VERY_BAD = 1,
  BAD = 2,
  NEUTRAL = 3,
  GOOD = 4,
  VERY_GOOD = 5,
}

/**
 * Mood labels for display purposes
 */
export const MoodLabels: Record<MoodLevel, string> = {
  [MoodLevel.VERY_BAD]: 'Very Bad',
  [MoodLevel.BAD]: 'Bad',
  [MoodLevel.NEUTRAL]: 'Neutral',
  [MoodLevel.GOOD]: 'Good',
  [MoodLevel.VERY_GOOD]: 'Very Good',
};

@Schema({ timestamps: true, collection: 'journal_entries' })
export class JournalEntry {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', default: null, index: true })
  workspaceId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorUserId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  updatedBy?: Types.ObjectId | null;

  @Prop({ required: true, default: () => new Date() })
  entryDate!: Date;

  @Prop({ trim: true })
  title?: string;

  @Prop({ required: true })
  content!: string;

  @Prop({
    min: MoodLevel.VERY_BAD,
    max: MoodLevel.VERY_GOOD,
    default: null,
  })
  mood?: MoodLevel;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  createdAt!: Date;
  updatedAt!: Date;
}

export const JournalEntrySchema = SchemaFactory.createForClass(JournalEntry);

// Text search index for content and title
JournalEntrySchema.index({ content: 'text', title: 'text' });

// User and workspace scoped indexes for common queries
JournalEntrySchema.index({ userId: 1, createdAt: -1 });
JournalEntrySchema.index({ userId: 1, entryDate: -1 });
JournalEntrySchema.index({ userId: 1, mood: 1 });
JournalEntrySchema.index({ userId: 1, tags: 1 });
JournalEntrySchema.index({ workspaceId: 1, createdAt: -1 });
JournalEntrySchema.index({ workspaceId: 1, entryDate: -1 });
JournalEntrySchema.index({ workspaceId: 1, mood: 1 });
JournalEntrySchema.index({ workspaceId: 1, tags: 1 });

// Date range query optimization
JournalEntrySchema.index({ userId: 1, entryDate: 1, mood: 1 });
JournalEntrySchema.index({ workspaceId: 1, entryDate: 1, mood: 1 });
JournalEntrySchema.set('toJSON', { virtuals: true });
JournalEntrySchema.set('toObject', { virtuals: true });
