import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDto {
  @ApiProperty({ description: 'Short-lived JWT access token (15m)' })
  accessToken!: string;

  @ApiProperty({ description: 'Long-lived JWT refresh token (7d)' })
  refreshToken!: string;

  @ApiProperty({
    description: 'Seconds until access token expires',
    example: 900,
  })
  expiresIn!: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  tokenVersion: number;
}

export interface JwtRefreshPayload extends JwtPayload {
  refreshToken: string;
}
