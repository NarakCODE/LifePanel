import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Extracts the authenticated user from the JWT payload.
 * The JWT strategy attaches the payload to req.user.
 *
 * Usage:
 *   @Get('me')
 *   getMe(@CurrentUser() user: JwtPayload) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? (user as any)[data] : user;
  },
);
