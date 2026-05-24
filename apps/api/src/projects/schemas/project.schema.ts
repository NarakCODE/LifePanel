import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;

export enum ProjectStatus {
  BACKLOG = 'backlog',
  PLANNED = 'planned',
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum ProjectPriority {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

@Schema({ timestamps: false })
export class ProjectWorkstream {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: 0, min: 0 })
  order!: number;

  @Prop({ type: Date, default: null })
  archivedAt?: Date | null;
}

export const ProjectWorkstreamSchema =
  SchemaFactory.createForClass(ProjectWorkstream);

@Schema({ timestamps: true, collection: 'projects' })
export class Project {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerUserId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  updatedBy?: Types.ObjectId | null;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({
    required: true,
    enum: Object.values(ProjectStatus),
    default: ProjectStatus.ACTIVE,
  })
  status!: ProjectStatus;

  @Prop({
    required: true,
    enum: Object.values(ProjectPriority),
    default: ProjectPriority.MEDIUM,
  })
  priority!: ProjectPriority;

  @Prop({ trim: true })
  typeLabel?: string;

  @Prop({ trim: true })
  durationLabel?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  memberUserIds!: Types.ObjectId[];

  @Prop({ type: [ProjectWorkstreamSchema], default: [] })
  workstreams!: ProjectWorkstream[];

  createdAt!: Date;
  updatedAt!: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.index({ workspaceId: 1, status: 1 });
ProjectSchema.index({ workspaceId: 1, updatedAt: -1 });
ProjectSchema.index({ ownerUserId: 1, status: 1 });
ProjectSchema.index({ memberUserIds: 1 });
