import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type TaskDocument = HydratedDocument<Task>;

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  DONE = 'done',
  ARCHIVED = 'archived',
}

export enum TaskPriority {
  NONE = 'no-priority',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskType {
  TASK = 'task',
  BUG = 'bug',
  FEATURE = 'feature',
  ISSUE = 'issue',
  EPIC = 'epic',
}

export enum TaskDependencyType {
  BLOCKING = 'blocking',
  WAITING_ON = 'waiting_on',
}

export enum TaskActivityAction {
  CREATED = 'created',
  UPDATED = 'updated',
  STATUS_CHANGED = 'status_changed',
  ARCHIVED = 'archived',
  RESTORED = 'restored',
  DUPLICATED = 'duplicated',
  MOVED = 'moved',
  COMMENTED = 'commented',
}

@Schema({ _id: false, timestamps: false })
export class TaskAssigneeSnapshot {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  id!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  avatarUrl?: string;

  @Prop({ trim: true })
  role?: string;
}

export const TaskAssigneeSnapshotSchema =
  SchemaFactory.createForClass(TaskAssigneeSnapshot);

@Schema({ timestamps: false })
export class TaskChecklistItem {
  @Prop({ required: true, trim: true })
  text!: string;

  @Prop({ default: false })
  checked!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  completedBy?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  completedAt?: Date | null;
}

export const TaskChecklistItemSchema =
  SchemaFactory.createForClass(TaskChecklistItem);

@Schema({ timestamps: false })
export class TaskChecklist {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ type: [TaskChecklistItemSchema], default: [] })
  items!: TaskChecklistItem[];
}

export const TaskChecklistSchema = SchemaFactory.createForClass(TaskChecklist);

@Schema({ timestamps: false })
export class TaskComment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  authorName!: string;

  @Prop({ required: true, trim: true })
  markdown!: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  mentionIds!: Types.ObjectId[];

  @Prop({ default: Date.now })
  createdAt!: Date;
}

export const TaskCommentSchema = SchemaFactory.createForClass(TaskComment);

@Schema({ _id: false, timestamps: false })
export class TaskCustomField {
  @Prop({ required: true, trim: true })
  key!: string;

  @Prop({ trim: true })
  label?: string;

  @Prop({ trim: true })
  type?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  value?: unknown;
}

export const TaskCustomFieldSchema =
  SchemaFactory.createForClass(TaskCustomField);

@Schema({ _id: false, timestamps: false })
export class TaskDependency {
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  taskId!: Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(TaskDependencyType),
  })
  type!: TaskDependencyType;
}

export const TaskDependencySchema =
  SchemaFactory.createForClass(TaskDependency);

@Schema({ _id: false, timestamps: false })
export class TaskActivityEntry {
  @Prop({
    required: true,
    enum: Object.values(TaskActivityAction),
  })
  action!: TaskActivityAction;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  actorId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  details!: Record<string, unknown>;

  @Prop({ default: Date.now })
  createdAt!: Date;
}

export const TaskActivityEntrySchema =
  SchemaFactory.createForClass(TaskActivityEntry);

@Schema({ timestamps: true, collection: 'tasks' })
export class Task {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', default: null, index: true })
  workspaceId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  updatedBy?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  completedBy?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  assigneeId?: Types.ObjectId | null;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [], index: true })
  assigneeIds!: Types.ObjectId[];

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  markdownDescription?: string;

  @Prop({
    required: true,
    enum: Object.values(TaskStatus),
    default: TaskStatus.TODO,
    index: true,
  })
  status!: TaskStatus;

  @Prop({
    required: true,
    enum: Object.values(TaskType),
    default: TaskType.TASK,
    index: true,
  })
  type!: TaskType;

  @Prop({
    type: Types.ObjectId,
    ref: 'CustomStatus',
    default: null,
    index: true,
  })
  customStatusId?: Types.ObjectId | null;

  @Prop({ type: Boolean, default: false })
  isRecurring!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'RecurringRule', default: null })
  recurringRuleId?: Types.ObjectId | null;

  // Denormalized project metadata keeps the tasks API usable until a
  // dedicated projects/workstreams backend exists.
  @Prop({ required: true, trim: true, index: true })
  projectId!: string;

  @Prop({ required: true, trim: true })
  projectName!: string;

  @Prop({ trim: true })
  workstreamId?: string;

  @Prop({ trim: true })
  workstreamName?: string;

  @Prop({ type: TaskAssigneeSnapshotSchema, default: null })
  assignee?: TaskAssigneeSnapshot | null;

  @Prop({ type: [TaskAssigneeSnapshotSchema], default: [] })
  assignees!: TaskAssigneeSnapshot[];

  @Prop({ type: [TaskAssigneeSnapshotSchema], default: [] })
  watchers!: TaskAssigneeSnapshot[];

  @Prop({ type: Number, min: 0, default: 0, index: true })
  projectOrder!: number;

  @Prop({ type: Number, min: 0, default: 0, index: true })
  workstreamOrder!: number;

  @Prop()
  startDate?: Date;

  @Prop({
    enum: Object.values(TaskPriority),
    default: TaskPriority.NONE,
  })
  priority!: TaskPriority;

  @Prop()
  tag?: string;

  @Prop({ type: [String], default: [], index: true })
  tags!: string[];

  @Prop()
  dueDate?: Date;

  @Prop()
  dueDateTime?: Date;

  @Prop({ type: Number, min: 0, default: 0 })
  timeEstimateMinutes!: number;

  @Prop({ type: Number, min: 0, default: 0 })
  timeSpentMinutes!: number;

  @Prop({ type: Types.ObjectId, ref: 'Task', default: null, index: true })
  parentTaskId?: Types.ObjectId | null;

  @Prop({ type: [Types.ObjectId], ref: 'Task', default: [] })
  subtaskIds!: Types.ObjectId[];

  @Prop({ type: [TaskChecklistSchema], default: [] })
  checklists!: TaskChecklist[];

  @Prop({ type: [TaskCommentSchema], default: [] })
  comments!: TaskComment[];

  @Prop({ type: [TaskCustomFieldSchema], default: [] })
  customFields!: TaskCustomField[];

  @Prop({ type: [TaskDependencySchema], default: [] })
  dependencies!: TaskDependency[];

  @Prop({ type: [TaskActivityEntrySchema], default: [] })
  activity!: TaskActivityEntry[];

  @Prop({ type: Date, default: null, index: true })
  archivedAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  archivedBy?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Task', default: null })
  duplicatedFromTaskId?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  completedAt?: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ workspaceId: 1, status: 1 });
TaskSchema.index({ userId: 1, projectId: 1 });
TaskSchema.index({ workspaceId: 1, projectId: 1 });
TaskSchema.index({ workspaceId: 1, projectId: 1, projectOrder: 1 });
TaskSchema.index({
  workspaceId: 1,
  projectId: 1,
  workstreamId: 1,
  workstreamOrder: 1,
});
TaskSchema.index({ userId: 1, startDate: 1 });
TaskSchema.index({ workspaceId: 1, startDate: 1 });
TaskSchema.index({ userId: 1, dueDate: 1 });
TaskSchema.index({ workspaceId: 1, dueDate: 1 });
TaskSchema.index({ userId: 1, dueDateTime: 1 });
TaskSchema.index({ workspaceId: 1, dueDateTime: 1 });
TaskSchema.index({ userId: 1, priority: 1 });
TaskSchema.index({ workspaceId: 1, priority: 1 });
TaskSchema.index({ userId: 1, tag: 1 });
TaskSchema.index({ workspaceId: 1, tag: 1 });
TaskSchema.index({ userId: 1, tags: 1 });
TaskSchema.index({ workspaceId: 1, tags: 1 });
TaskSchema.index({ userId: 1, 'assignee.id': 1 });
TaskSchema.index({ workspaceId: 1, assigneeId: 1 });
TaskSchema.index({ workspaceId: 1, 'assignees.id': 1 });
TaskSchema.index({ workspaceId: 1, 'watchers.id': 1 });
TaskSchema.index({ workspaceId: 1, parentTaskId: 1 });
TaskSchema.index({ workspaceId: 1, type: 1 });
TaskSchema.index({ workspaceId: 1, archivedAt: 1 });
TaskSchema.index({ workspaceId: 1, customStatusId: 1 });
