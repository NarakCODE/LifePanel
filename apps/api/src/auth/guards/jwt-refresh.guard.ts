import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Used exclusively on POST /auth/refresh.
 * Validates the refresh token via JwtRefreshStrategy.
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
