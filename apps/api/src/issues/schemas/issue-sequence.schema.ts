import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type IssueSequenceDocument = HydratedDocument<IssueSequence>;

@Schema({ timestamps: false, collection: 'issue_sequences' })
export class IssueSequence {
  @Prop({
    type: Types.ObjectId,
    ref: 'Workspace',
    required: true,
    unique: true,
  })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true, default: 0, min: 0 })
  nextValue!: number;

  @Prop({ required: true, default: 'ISS', trim: true, uppercase: true })
  prefix!: string;
}

export const IssueSequenceSchema = SchemaFactory.createForClass(IssueSequence);
