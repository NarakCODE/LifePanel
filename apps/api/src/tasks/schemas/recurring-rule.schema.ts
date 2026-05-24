import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RecurringRuleDocument = HydratedDocument<RecurringRule>;

@Schema({ timestamps: true, collection: 'recurring_rules' })
export class RecurringRule {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Task', required: true, unique: true })
  taskId!: Types.ObjectId;

  @Prop({ required: true, enum: ['DAILY', 'WEEKLY', 'MONTHLY'] })
  frequency!: string;

  @Prop({ type: Number, default: 1 })
  interval!: number;

  @Prop({ type: Date, default: null })
  endDate?: Date | null;

  @Prop({ type: Date, default: null })
  lastGenerated?: Date | null;
}

export const RecurringRuleSchema = SchemaFactory.createForClass(RecurringRule);
