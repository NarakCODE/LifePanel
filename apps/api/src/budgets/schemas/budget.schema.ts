import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BudgetDocument = HydratedDocument<Budget>;

export enum BudgetPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

export enum BudgetHealth {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  OVER_BUDGET = 'over_budget',
}

@Schema({ timestamps: true, collection: 'budgets' })
export class Budget {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', default: null, index: true })
  workspaceId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  updatedBy?: Types.ObjectId | null;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({ trim: true })
  category?: string;

  @Prop({
    required: true,
    enum: Object.values(BudgetPeriod),
    default: BudgetPeriod.MONTHLY,
  })
  period!: BudgetPeriod;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop({ default: 'USD', uppercase: true, length: 3 })
  currency!: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: '#3b82f6' })
  color?: string;

  @Prop({ min: 0, max: 100, default: 80 })
  alertThreshold?: number;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ type: Types.ObjectId, ref: 'Budget', default: null })
  parentBudgetId?: Types.ObjectId | null;

  @Prop({ default: false })
  isArchived?: boolean;

  @Prop()
  archivedAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);

BudgetSchema.index({ userId: 1, isActive: 1 });
BudgetSchema.index({ userId: 1, period: 1 });
BudgetSchema.index({ workspaceId: 1, isActive: 1 });
BudgetSchema.index({ workspaceId: 1, period: 1 });
BudgetSchema.index({ workspaceId: 1, category: 1 });
BudgetSchema.index({ userId: 1, tags: 1 });
