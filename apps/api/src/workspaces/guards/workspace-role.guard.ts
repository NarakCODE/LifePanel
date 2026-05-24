import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WORKSPACE_ROLE_KEY } from '../decorators/require-workspace-role.decorator';
import { WorkspaceRole } from '../schemas/workspace.schema';

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private roleWeight(role: WorkspaceRole): number {
    switch (role) {
      case WorkspaceRole.OWNER:
        return 4;
      case WorkspaceRole.ADMIN:
        return 3;
      case WorkspaceRole.MEMBER:
        return 2;
      case WorkspaceRole.VIEWER:
        return 1;
      default:
        return 0;
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRole = this.reflector.getAllAndOverride<WorkspaceRole>(
      WORKSPACE_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRole) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { workspaceRole } = request;

    if (!workspaceRole) {
      throw new ForbiddenException(
        'Workspace role is missing in request context. Ensure WorkspaceAccessGuard runs first.',
      );
    }

    const userWeight = this.roleWeight(workspaceRole as WorkspaceRole);
    const requiredWeight = this.roleWeight(requiredRole);

    if (userWeight >= requiredWeight) {
      return true;
    }

    throw new ForbiddenException('Insufficient workspace permissions');
  }
}
