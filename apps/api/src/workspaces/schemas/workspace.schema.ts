import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WorkspaceDocument = HydratedDocument<Workspace>;

export enum WorkspaceType {
  SOLO = 'solo',
  COLLABORATIVE = 'collaborative',
}

export enum WorkspaceStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

@Schema({ _id: false })
export class WorkspaceMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(WorkspaceRole),
  })
  role!: WorkspaceRole;
}

export const WorkspaceMemberSchema =
  SchemaFactory.createForClass(WorkspaceMember);

@Schema({ timestamps: true, collection: 'workspaces' })
export class Workspace {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(WorkspaceType),
    default: WorkspaceType.COLLABORATIVE,
    index: true,
  })
  type!: WorkspaceType;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(WorkspaceStatus),
    default: WorkspaceStatus.ACTIVE,
    index: true,
  })
  status!: WorkspaceStatus;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
    sparse: true,
    unique: true,
  })
  defaultForUserId?: Types.ObjectId | null;

  @Prop({ type: [WorkspaceMemberSchema], default: [] })
  members!: WorkspaceMember[];

  @Prop({ type: String, sparse: true, unique: true, default: null })
  joinLinkToken?: string | null;

  @Prop({ type: Boolean, default: false })
  isJoinLinkEnabled!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
WorkspaceSchema.index({ 'members.userId': 1 });
WorkspaceSchema.index({ ownerId: 1, status: 1 });
