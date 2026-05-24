import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type HabitLogDocument = HydratedDocument<HabitLog>;

@Schema({ timestamps: true, collection: 'habit_logs' })
export class HabitLog {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', default: null, index: true })
  workspaceId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Habit', required: true, index: true })
  habitId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  actorUserId!: Types.ObjectId;

  @Prop({ required: true })
  loggedDate!: Date;

  @Prop({ min: 1, default: 1 })
  count!: number;

  @Prop({ trim: true })
  notes?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const HabitLogSchema = SchemaFactory.createForClass(HabitLog);

HabitLogSchema.index({ habitId: 1, loggedDate: 1 }, { unique: true });
HabitLogSchema.index({ userId: 1, loggedDate: -1 });
HabitLogSchema.index({ workspaceId: 1, loggedDate: -1 });
