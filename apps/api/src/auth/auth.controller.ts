import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthTokensDto, JwtRefreshPayload } from './dto/auth-tokens.dto';
import { VerifyEmailDto, ResendVerificationDto } from './dto/verify-email.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from './dto/auth-tokens.dto';
import { ProfileService } from './services/profile.service';
import { AccountService } from './services/account.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { Throttle } from '@nestjs/throttler';
import type { FileUpload } from '../upload/upload.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly profileService: ProfileService,
    private readonly accountService: AccountService,
  ) {}

  // ── Registration & Verification ───────────────────────────────────────────

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates the account and sends a 6-digit verification code via email. ' +
      'The user must verify before they can log in.',
  })
  @ApiCreatedResponse({
    schema: {
      type: 'object',
      properties: { message: { type: 'string' } },
    },
  })
  register(@Body() dto: RegisterDto): Promise<{ message: string }> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address with OTP code',
    description:
      'Submit the 6-digit code sent to the registered email. ' +
      'Call this before attempting to log in.',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { message: { type: 'string' } },
    },
  })
  verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
    return this.authService.verifyEmailByEmail({
      email: dto.email,
      code: dto.code,
    });
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend email verification code',
    description:
      'Rate-limited to 1 request per minute. Always returns 200 regardless of whether the email exists.',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { message: { type: 'string' } },
    },
  })
  resendVerification(
    @Body() dto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    return this.authService.resendVerification(dto.email);
  }

  // ── Session Management ────────────────────────────────────────────────────

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with email and password',
    description: 'Only verified users can obtain tokens.',
  })
  @ApiOkResponse({ type: AuthTokensDto })
  login(@Body() dto: LoginDto): Promise<AuthTokensDto> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('dev-bootstrap')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Development-only local session bootstrap',
    description:
      'Creates or reuses a verified local development account and returns session tokens. Intended for local development only.',
  })
  @ApiOkResponse({ type: AuthTokensDto })
  devBootstrap(): Promise<AuthTokensDto> {
    return this.authService.devBootstrap();
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Rotate tokens using a valid refresh token' })
  @ApiOkResponse({ type: AuthTokensDto })
  refresh(@CurrentUser() user: JwtRefreshPayload): Promise<AuthTokensDto> {
    return this.authService.refresh(user.sub, user.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout — invalidates the refresh token' })
  @ApiOkResponse({
    schema: { type: 'object', properties: { message: { type: 'string' } } },
  })
  async logout(@CurrentUser() user: JwtPayload): Promise<{ message: string }> {
    await this.authService.logout(user.sub);
    return { message: 'Logged out successfully' };
  }

  // ── Profile ───────────────────────────────────────────────────────────────

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the current authenticated user' })
  @ApiOkResponse({ type: MeResponseDto })
  getMe(@CurrentUser() user: JwtPayload): Promise<MeResponseDto> {
    return this.profileService.getProfile(user.sub);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update the current authenticated user profile' })
  @ApiOkResponse({ type: MeResponseDto })
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ): Promise<MeResponseDto> {
    await this.profileService.updateProfile(user.sub, dto);
    return this.profileService.getProfile(user.sub);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change the current password' })
  @ApiOkResponse({
    schema: { type: 'object', properties: { message: { type: 'string' } } },
  })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.accountService.changePassword(user.sub, dto);
    return { message: 'Password changed successfully' };
  }

  @Post('update-email')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update the email address for the account' })
  @ApiOkResponse({
    schema: { type: 'object', properties: { message: { type: 'string' } } },
  })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async updateEmail(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateEmailDto,
  ) {
    await this.accountService.updateEmail(user.sub, dto);
    return {
      message: 'Email updated; verify the new address to reactivate login.',
    };
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete the authenticated user account' })
  @ApiOkResponse({
    schema: { type: 'object', properties: { message: { type: 'string' } } },
  })
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  async deleteAccount(
    @CurrentUser() user: JwtPayload,
    @Body() dto: DeleteAccountDto,
  ) {
    await this.accountService.deleteAccount(user.sub, dto);
    return {
      message: 'Account deletion requested. Cancellation window may apply.',
    };
  }

  // ── Avatar Upload ────────────────────────────────────────────────────────

  @Post('me/avatar')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image file (JPEG, PNG, WebP, GIF). Max 5MB.',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (_req, file, callback) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File & { buffer: Buffer },
  ) {
    if (!file) {
      throw new Error('No file provided');
    }

    const fileUpload: FileUpload = {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };

    const avatarUrl = await this.profileService.uploadAvatar(
      user.sub,
      fileUpload,
    );

    return {
      success: true,
      data: {
        avatarUrl,
      },
    };
  }
}
