import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { WorkspaceRequestContext } from '../interfaces/workspace-context.interface';

export const WorkspaceContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): WorkspaceRequestContext | null => {
    const request = ctx.switchToHttp().getRequest();
    return (request.workspaceContext as WorkspaceRequestContext) ?? null;
  },
);
