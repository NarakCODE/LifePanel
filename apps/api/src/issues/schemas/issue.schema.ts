import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type IssueDocument = HydratedDocument<Issue>;

export enum IssueStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  IN_REVIEW = 'in-review',
  DONE = 'done',
  CANCELED = 'canceled',
}

export enum IssuePriority {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum IssueType {
  TASK = 'task',
  BUG = 'bug',
  IMPROVEMENT = 'improvement',
  QUESTION = 'question',
  BLOCKER = 'blocker',
}

@Schema({ timestamps: true, collection: 'issues' })
export class Issue {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title!: string;

  @Prop({ type: String, trim: true, default: null })
  description?: string | null;

  @Prop({ required: true, trim: true, uppercase: true, index: true })
  identifier!: string;

  @Prop({
    required: true,
    enum: Object.values(IssueStatus),
    default: IssueStatus.BACKLOG,
    index: true,
  })
  status!: IssueStatus;

  @Prop({
    required: true,
    enum: Object.values(IssuePriority),
    default: IssuePriority.NONE,
    index: true,
  })
  priority!: IssuePriority;

  @Prop({
    required: true,
    enum: Object.values(IssueType),
    default: IssueType.TASK,
    index: true,
  })
  type!: IssueType;

  @Prop({ type: Types.ObjectId, ref: 'Project', default: null, index: true })
  projectId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Cycle', default: null, index: true })
  cycleId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  assigneeId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  reporterId!: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  labels!: string[];

  @Prop({ type: Date, default: null, index: true })
  dueDate?: Date | null;

  @Prop({ type: Date, default: null, index: true })
  completedAt?: Date | null;

  @Prop({ type: Date, default: null, index: true })
  archivedAt?: Date | null;
}

export const IssueSchema = SchemaFactory.createForClass(Issue);

IssueSchema.index({ workspaceId: 1, identifier: 1 }, { unique: true });
IssueSchema.index({ workspaceId: 1, status: 1, priority: 1 });
IssueSchema.index({ workspaceId: 1, type: 1, status: 1 });
IssueSchema.index({ workspaceId: 1, projectId: 1, status: 1 });
IssueSchema.index({ workspaceId: 1, cycleId: 1, status: 1 });
IssueSchema.index({ workspaceId: 1, assigneeId: 1, status: 1 });
IssueSchema.index({ workspaceId: 1, reporterId: 1, createdAt: -1 });
IssueSchema.index({ workspaceId: 1, labels: 1 });
IssueSchema.index({ workspaceId: 1, archivedAt: 1, updatedAt: -1 });
IssueSchema.index({ workspaceId: 1, title: 'text', description: 'text' });
