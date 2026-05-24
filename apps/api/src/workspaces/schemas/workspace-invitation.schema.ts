import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { WorkspaceRole } from './workspace.schema';

export type WorkspaceInvitationDocument = HydratedDocument<WorkspaceInvitation>;

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  REVOKED = 'revoked',
}

@Schema({ timestamps: true, collection: 'workspace_invitations' })
export class WorkspaceInvitation {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  email!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  invitedBy!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(WorkspaceRole),
  })
  role!: WorkspaceRole;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(InvitationStatus),
    default: InvitationStatus.PENDING,
  })
  status!: InvitationStatus;

  @Prop({ required: true, trim: true, index: true })
  token!: string;

  @Prop({ required: true, index: true })
  expiresAt!: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  acceptedBy?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  respondedAt?: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const WorkspaceInvitationSchema =
  SchemaFactory.createForClass(WorkspaceInvitation);
WorkspaceInvitationSchema.index(
  { workspaceId: 1, email: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: InvitationStatus.PENDING },
  },
);
