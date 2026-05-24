import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TransactionDocument = HydratedDocument<Transaction>;

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum TransactionCategory {
  FOOD = 'food',
  TRANSPORT = 'transport',
  HOUSING = 'housing',
  HEALTH = 'health',
  ENTERTAINMENT = 'entertainment',
  SHOPPING = 'shopping',
  EDUCATION = 'education',
  SALARY = 'salary',
  INVESTMENT = 'investment',
  OTHER = 'other',
}

@Schema({ timestamps: true, collection: 'transactions' })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', default: null, index: true })
  workspaceId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  updatedBy?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Budget', default: null })
  budgetId?: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({ required: true, enum: Object.values(TransactionType) })
  type!: TransactionType;

  @Prop({
    required: true,
    enum: Object.values(TransactionCategory),
    default: TransactionCategory.OTHER,
  })
  category!: TransactionCategory;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, index: true })
  date!: Date;

  @Prop({ default: 'USD', uppercase: true, length: 3 })
  currency!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, category: 1, date: -1 });
TransactionSchema.index({ userId: 1, budgetId: 1 });
TransactionSchema.index({ userId: 1, type: 1 });
TransactionSchema.index({ workspaceId: 1, date: -1 });
TransactionSchema.index({ workspaceId: 1, category: 1, date: -1 });
TransactionSchema.index({ workspaceId: 1, budgetId: 1 });
TransactionSchema.index({ workspaceId: 1, type: 1 });
