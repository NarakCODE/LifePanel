import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TimeLogDocument = HydratedDocument<TimeLog>;

@Schema({ timestamps: true, collection: 'time_logs' })
export class TimeLog {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Task', required: true, index: true })
  taskId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  durationMin!: number;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: Date.now })
  loggedAt!: Date;
}

export const TimeLogSchema = SchemaFactory.createForClass(TimeLog);
