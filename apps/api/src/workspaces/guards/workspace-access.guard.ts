import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { WorkspacesService } from '../workspaces.service';

@Injectable()
export class WorkspaceAccessGuard implements CanActivate {
  constructor(private readonly workspacesService: WorkspacesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Appended by JwtAuthGuard

    if (!user || !user.sub) {
      throw new ForbiddenException('User is not authenticated');
    }

    const workspaceId =
      request.headers['x-workspace-id'] ||
      request.params.workspaceId ||
      request.body.workspaceId ||
      request.query.workspaceId;

    const normalizedWorkspaceId =
      typeof workspaceId === 'string' && workspaceId.trim().length > 0
        ? workspaceId
        : undefined;

    const resolved = await this.workspacesService.resolveAccessContext(
      user.sub,
      normalizedWorkspaceId,
    );

    if (!resolved) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    request.workspaceId = resolved.workspaceId;
    request.workspaceRole = resolved.role;
    request.workspacePermissions = resolved.permissions;
    request.workspaceContext = resolved;

    return true;
  }
}
