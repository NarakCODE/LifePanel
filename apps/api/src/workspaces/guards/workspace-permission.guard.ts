import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WORKSPACE_PERMISSION_KEY } from '../decorators/require-workspace-permission.decorator';
import { WorkspacePermission } from '../workspace-permissions';

@Injectable()
export class WorkspacePermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission =
      this.reflector.getAllAndOverride<WorkspacePermission>(
        WORKSPACE_PERMISSION_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const permissions =
      (request.workspacePermissions as WorkspacePermission[]) ?? [];

    if (permissions.includes(requiredPermission)) {
      return true;
    }

    throw new ForbiddenException('Insufficient workspace permissions');
  }
}
