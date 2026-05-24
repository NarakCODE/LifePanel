import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WorkspaceJoinRequestDocument =
  HydratedDocument<WorkspaceJoinRequest>;

export enum JoinRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true, collection: 'workspace_join_requests' })
export class WorkspaceJoinRequest {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(JoinRequestStatus),
    default: JoinRequestStatus.PENDING,
    index: true,
  })
  status!: JoinRequestStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  resolvedBy?: Types.ObjectId;

  @Prop({ type: Date })
  resolvedAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const WorkspaceJoinRequestSchema =
  SchemaFactory.createForClass(WorkspaceJoinRequest);

WorkspaceJoinRequestSchema.index(
  { workspaceId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: JoinRequestStatus.PENDING },
  },
);
