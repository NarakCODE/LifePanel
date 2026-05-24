import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

const baseConfig = {
  get: jest.fn((key: string, fallback?: string) => {
    if (key === 'jwt.expiresIn') return '15m';
    if (key === 'jwt.secret') return 'access-secret';
    if (key === 'jwt.refreshSecret') return 'refresh-secret';
    if (key === 'jwt.refreshExpiresIn') return '7d';
    if (key === 'app.nodeEnv') return 'development';
    return fallback;
  }),
};

describe('AuthService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    baseConfig.get.mockClear();
  });

  it('reuses the provided refresh token when refreshing', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const usersService = {
      findById: jest.fn().mockResolvedValue({
        _id: { toString: () => userId },
        email: 'user@example.com',
        isEmailVerified: true,
        tokenVersion: 2,
        status: 'active',
        passwordHash: 'hash',
      }),
    };
    const usersRepo = {
      updateRefreshTokenHash: jest.fn(),
    };
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('new-access-token'),
    };
    const service = new AuthService(
      usersService as never,
      usersRepo as never,
      {} as never,
      {
        sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      } as never,
      jwtService as never,
      baseConfig as never,
    );

    await expect(
      service.refresh(userId, 'existing-refresh-token'),
    ).resolves.toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'existing-refresh-token',
      expiresIn: 900,
    });

    expect(jwtService.signAsync).toHaveBeenCalledTimes(1);
    expect(usersRepo.updateRefreshTokenHash).not.toHaveBeenCalled();
  });

  it('bootstraps a verified local development session', async () => {
    const userId = '507f1f77bcf86cd799439012';
    const createdUser = {
      _id: { toString: () => userId },
      email: 'dev@life-dashboard.local',
      displayName: 'Local Dev User',
      isEmailVerified: false,
      tokenVersion: 0,
      status: 'active',
    };
    const verifiedUser = {
      ...createdUser,
      isEmailVerified: true,
    };

    const usersService = {
      findById: jest.fn().mockResolvedValue(verifiedUser),
      findByEmail: jest.fn().mockResolvedValueOnce(null),
      create: jest.fn().mockResolvedValue(createdUser),
      markEmailVerified: jest.fn().mockResolvedValue(undefined),
      setLastLogin: jest.fn().mockResolvedValue(undefined),
    };
    const usersRepo = {
      updateRefreshTokenHash: jest.fn().mockResolvedValue(undefined),
    };
    const jwtService = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('dev-access-token')
        .mockResolvedValueOnce('dev-refresh-token'),
    };

    const service = new AuthService(
      usersService as never,
      usersRepo as never,
      {} as never,
      {
        sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      } as never,
      jwtService as never,
      baseConfig as never,
    );

    await expect(service.devBootstrap()).resolves.toEqual({
      accessToken: 'dev-access-token',
      refreshToken: 'dev-refresh-token',
      expiresIn: 900,
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'dev@life-dashboard.local',
      }),
    );
    expect(usersService.markEmailVerified).toHaveBeenCalledWith(userId);
  });

  it('records the last login when credentials are valid', async () => {
    const userId = '507f1f77bcf86cd799439013';
    const usersService = {
      findByEmail: jest.fn().mockResolvedValue({
        _id: { toString: () => userId },
        email: 'user@example.com',
        displayName: 'User',
        isEmailVerified: true,
        passwordHash: 'hash',
        tokenVersion: 0,
        status: 'active',
      }),
      setLastLogin: jest.fn().mockResolvedValue(undefined),
    };
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    };

    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    const service = new AuthService(
      usersService as never,
      {} as never,
      {} as never,
      {
        sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      } as never,
      jwtService as never,
      baseConfig as never,
    );

    await service.login({ email: 'user@example.com', password: 'password123' });

    expect(usersService.setLastLogin).toHaveBeenCalledWith(userId);
  });
});
