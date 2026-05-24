import { WorkspaceRole } from './schemas/workspace.schema';

export enum WorkspacePermission {
  WORKSPACE_READ = 'workspace.read',
  WORKSPACE_UPDATE = 'workspace.update',
  WORKSPACE_DELETE = 'workspace.delete',
  MEMBER_INVITE = 'member.invite',
  MEMBER_REMOVE = 'member.remove',
  MEMBER_ROLE_UPDATE = 'member.role.update',
  PROJECT_READ = 'project.read',
  PROJECT_WRITE = 'project.write',
  TASK_READ = 'task.read',
  TASK_WRITE = 'task.write',
  TASK_ASSIGN = 'task.assign',
  ISSUE_READ = 'issue.read',
  ISSUE_WRITE = 'issue.write',
  GOAL_READ = 'goal.read',
  GOAL_WRITE = 'goal.write',
  HABIT_READ = 'habit.read',
  HABIT_WRITE = 'habit.write',
  BUDGET_READ = 'budget.read',
  BUDGET_WRITE = 'budget.write',
  TRANSACTION_READ = 'transaction.read',
  TRANSACTION_WRITE = 'transaction.write',
  JOURNAL_READ = 'journal.read',
  JOURNAL_WRITE = 'journal.write',
  NOTIFICATION_READ = 'notification.read',
  NOTIFICATION_WRITE = 'notification.write',
  NOTE_READ = 'note.read',
  NOTE_WRITE = 'note.write',
}

const VIEWER_PERMISSIONS: WorkspacePermission[] = [
  WorkspacePermission.WORKSPACE_READ,
  WorkspacePermission.PROJECT_READ,
  WorkspacePermission.TASK_READ,
  WorkspacePermission.ISSUE_READ,
  WorkspacePermission.GOAL_READ,
  WorkspacePermission.HABIT_READ,
  WorkspacePermission.BUDGET_READ,
  WorkspacePermission.TRANSACTION_READ,
  WorkspacePermission.JOURNAL_READ,
  WorkspacePermission.NOTIFICATION_READ,
  WorkspacePermission.NOTE_READ,
];

const MEMBER_PERMISSIONS: WorkspacePermission[] = [
  ...VIEWER_PERMISSIONS,
  WorkspacePermission.PROJECT_WRITE,
  WorkspacePermission.TASK_WRITE,
  WorkspacePermission.TASK_ASSIGN,
  WorkspacePermission.ISSUE_WRITE,
  WorkspacePermission.GOAL_WRITE,
  WorkspacePermission.HABIT_WRITE,
  WorkspacePermission.BUDGET_WRITE,
  WorkspacePermission.TRANSACTION_WRITE,
  WorkspacePermission.JOURNAL_WRITE,
  WorkspacePermission.NOTIFICATION_WRITE,
  WorkspacePermission.NOTE_WRITE,
];

const ADMIN_PERMISSIONS: WorkspacePermission[] = [
  ...MEMBER_PERMISSIONS,
  WorkspacePermission.WORKSPACE_UPDATE,
  WorkspacePermission.MEMBER_INVITE,
  WorkspacePermission.MEMBER_REMOVE,
  WorkspacePermission.MEMBER_ROLE_UPDATE,
];

const OWNER_PERMISSIONS: WorkspacePermission[] = [
  ...ADMIN_PERMISSIONS,
  WorkspacePermission.WORKSPACE_DELETE,
];

const ROLE_PERMISSIONS: Record<WorkspaceRole, WorkspacePermission[]> = {
  [WorkspaceRole.OWNER]: OWNER_PERMISSIONS,
  [WorkspaceRole.ADMIN]: ADMIN_PERMISSIONS,
  [WorkspaceRole.MEMBER]: MEMBER_PERMISSIONS,
  [WorkspaceRole.VIEWER]: VIEWER_PERMISSIONS,
};

export function getWorkspacePermissions(
  role: WorkspaceRole,
): WorkspacePermission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
