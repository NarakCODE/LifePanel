import { Types } from 'mongoose';

export type WorkspaceScope = {
  workspaceId: string | Types.ObjectId;
  userId: string | Types.ObjectId;
};

export function toObjectId(value: string | Types.ObjectId): Types.ObjectId {
  return value instanceof Types.ObjectId ? value : new Types.ObjectId(value);
}

export function toObjectIdOrNull(
  value: string | Types.ObjectId,
): Types.ObjectId | null {
  if (value instanceof Types.ObjectId) {
    return value;
  }

  if (!Types.ObjectId.isValid(value)) {
    return null;
  }

  return new Types.ObjectId(value);
}

export function buildWorkspaceScopedFilter(
  scope: WorkspaceScope,
  legacyFilter: Record<string, unknown>,
): Record<string, unknown> {
  const workspaceObjectId = toObjectId(scope.workspaceId);

  return {
    $or: [
      { workspaceId: workspaceObjectId },
      {
        workspaceId: { $exists: false },
        ...legacyFilter,
      },
      {
        workspaceId: null,
        ...legacyFilter,
      },
    ],
  };
}
