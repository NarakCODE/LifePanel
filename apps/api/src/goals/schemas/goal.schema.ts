import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type GoalDocument = HydratedDocument<Goal>;

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum GoalType {
  MANUAL = 'manual',
  TASK_BASED = 'task-based',
  HABIT_BASED = 'habit-based',
  MIXED = 'mixed',
}

@Schema({ _id: true, timestamps: false })
export class ProgressLog {
  @Prop({ required: true })
  value!: number;

  @Prop({ trim: true })
  note?: string;

  @Prop({ required: true, default: Date.now })
  loggedAt!: Date;
}

export const ProgressLogSchema = SchemaFactory.createForClass(ProgressLog);

@Schema({ timestamps: true, collection: 'goals' })
export class Goal {
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
  description?: string;

  @Prop({
    required: true,
    enum: Object.values(GoalType),
    default: GoalType.MANUAL,
  })
  type!: GoalType;

  @Prop({ required: true, min: 0 })
  targetValue!: number;

  @Prop({ default: 0, min: 0 })
  currentValue!: number;

  @Prop({ trim: true })
  unit?: string;

  @Prop()
  dueDate?: Date;

  @Prop({
    required: true,
    enum: Object.values(GoalStatus),
    default: GoalStatus.ACTIVE,
    index: true,
  })
  status!: GoalStatus;

  @Prop({ type: [ProgressLogSchema], default: [] })
  progressLogs!: ProgressLog[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Task' }], default: [] })
  linkedTasks!: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Habit' }], default: [] })
  linkedHabits!: Types.ObjectId[];

  get progressPercent(): number {
    if (!this.targetValue) return 0;
    return Math.min(
      Math.round((this.currentValue / this.targetValue) * 100),
      100,
    );
  }

  createdAt!: Date;
  updatedAt!: Date;
}

export const GoalSchema = SchemaFactory.createForClass(Goal);

GoalSchema.index({ userId: 1, status: 1 });
GoalSchema.index({ userId: 1, dueDate: 1 });
GoalSchema.index({ workspaceId: 1, status: 1 });
GoalSchema.index({ workspaceId: 1, dueDate: 1 });
GoalSchema.set('toJSON', { virtuals: true });
GoalSchema.set('toObject', { virtuals: true });
