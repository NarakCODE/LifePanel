import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '../users/users.module';
import { OtpCodesModule } from '../otp-codes/otp-codes.module';
import { EmailModule } from '../email/email.module';
import { UploadModule } from '../upload/upload.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ProfileService } from './services/profile.service';
import { AccountService } from './services/account.service';
import { EmailVerificationService } from './services/email-verification.service';
import { jwtConfig } from './config/jwt.config';

@Module({
  imports: [
    UsersModule,
    OtpCodesModule,
    EmailModule,
    UploadModule,
    PassportModule,
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret', 'fallback-secret'),
        signOptions: {
          expiresIn: config.get<string>('jwt.expiresIn', '15m') as never,
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    ProfileService,
    AccountService,
    EmailVerificationService,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtAuthGuard,
    // Register JwtAuthGuard globally — ALL routes now require JWT
    // unless decorated with @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
