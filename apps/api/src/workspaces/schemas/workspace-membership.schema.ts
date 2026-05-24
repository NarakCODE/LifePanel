import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { WorkspaceRole } from './workspace.schema';

export type WorkspaceMembershipDocument = HydratedDocument<WorkspaceMembership>;

export enum WorkspaceMembershipStatus {
  ACTIVE = 'active',
  LEFT = 'left',
  SUSPENDED = 'suspended',
}

@Schema({ timestamps: true, collection: 'workspace_memberships' })
export class WorkspaceMembership {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(WorkspaceRole),
  })
  role!: WorkspaceRole;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(WorkspaceMembershipStatus),
    default: WorkspaceMembershipStatus.ACTIVE,
    index: true,
  })
  status!: WorkspaceMembershipStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  invitedBy?: Types.ObjectId | null;

  @Prop({ default: Date.now })
  joinedAt!: Date;

  @Prop({ type: Date, default: null })
  lastActiveAt?: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const WorkspaceMembershipSchema =
  SchemaFactory.createForClass(WorkspaceMembership);

WorkspaceMembershipSchema.index(
  { workspaceId: 1, userId: 1 },
  { unique: true },
);
WorkspaceMembershipSchema.index({ userId: 1, status: 1 });
WorkspaceMembershipSchema.index({ workspaceId: 1, status: 1 });
