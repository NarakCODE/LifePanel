import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CustomStatusDocument = HydratedDocument<CustomStatus>;

@Schema({ timestamps: true, collection: 'custom_statuses' })
export class CustomStatus {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  color!: string;

  @Prop({ type: Number, required: true })
  order!: number;

  @Prop({ type: Boolean, default: false })
  isCompletedStatus!: boolean;
}

export const CustomStatusSchema = SchemaFactory.createForClass(CustomStatus);
