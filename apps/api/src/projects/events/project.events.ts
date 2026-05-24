/**
 * Project domain event constants and payload interfaces.
 * (arch-use-events) — all event names live in one place to prevent typos.
 */

// ── Event name constants ─────────────────────────────────────────────────────

export const PROJECT_EVENTS = {
  CREATED: 'project.created',
  UPDATED: 'project.updated',
  DELETED: 'project.deleted',
  TASK_MOVED: 'project.task.moved',
  TASKS_REORDERED: 'project.tasks.reordered',
  WORKSTREAM_TASKS_REORDERED: 'project.workstream.tasks.reordered',
} as const;

export type ProjectEventName =
  (typeof PROJECT_EVENTS)[keyof typeof PROJECT_EVENTS];

// ── Event payload interfaces ─────────────────────────────────────────────────

export interface ProjectCreatedEvent {
  projectId: string;
  workspaceId: string;
  actorUserId: string;
  name: string;
}

export interface ProjectUpdatedEvent {
  projectId: string;
  workspaceId: string;
  actorUserId: string;
  changes: string[];
}

export interface ProjectDeletedEvent {
  projectId: string;
  workspaceId: string;
  actorUserId: string;
}

export interface ProjectTaskMovedEvent {
  projectId: string;
  taskId: string;
  workspaceId: string;
  actorUserId: string;
  targetWorkstreamId?: string;
  targetOrder?: number;
}

export interface ProjectTasksReorderedEvent {
  projectId: string;
  workspaceId: string;
  actorUserId: string;
}

export interface ProjectWorkstreamTasksReorderedEvent {
  projectId: string;
  workstreamId: string;
  workspaceId: string;
  actorUserId: string;
}
