import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../dto/auth-tokens.dto';
import { UsersRepository } from '../../users/users.repository';
import { UserStatus } from '../../users/schemas/user.schema';

/**
 * Access token strategy (security-auth-jwt).
 * Validates Bearer token from Authorization header.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly usersRepo: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret', 'fallback-secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.usersRepo.findById(payload.sub);

    if (
      !user ||
      user.status === UserStatus.DELETED ||
      user.status === UserStatus.PENDING_DELETION
    ) {
      throw new UnauthorizedException('Invalid session');
    }

    if ((user.tokenVersion ?? 0) !== payload.tokenVersion) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      tokenVersion: payload.tokenVersion,
    };
  }
}
