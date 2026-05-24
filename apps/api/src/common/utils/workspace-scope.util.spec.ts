import { Types } from 'mongoose';
import {
  buildWorkspaceScopedFilter,
  toObjectId,
  toObjectIdOrNull,
} from './workspace-scope.util';

describe('workspace scope util', () => {
  it('builds a workspace-first filter with legacy fallbacks', () => {
    const workspaceId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const filter = buildWorkspaceScopedFilter(
      { workspaceId, userId },
      { userId, status: 'active' },
    );

    expect(filter).toEqual({
      $or: [
        { workspaceId },
        { workspaceId: { $exists: false }, userId, status: 'active' },
        { workspaceId: null, userId, status: 'active' },
      ],
    });
  });

  it('normalizes object ids safely', () => {
    const objectId = new Types.ObjectId();

    expect(toObjectId(objectId)).toBe(objectId);
    expect(toObjectIdOrNull(objectId.toString())?.toString()).toBe(
      objectId.toString(),
    );
    expect(toObjectIdOrNull('not-an-object-id')).toBeNull();
  });
});
