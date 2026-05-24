import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { OtpCodesRepository } from './otp-codes.repository';
import { OtpCodeDocument, OtpType } from './schemas/otp-code.schema';

const OTP_EXPIRY_SECONDS = 15 * 60; // 15 minutes
const OTP_RESEND_WINDOW_SECONDS = 60; // at most 1 per minute
const OTP_MAX_PER_WINDOW = 1;
const OTP_LENGTH = 6;

@Injectable()
export class OtpCodesService {
  constructor(private readonly otpCodesRepo: OtpCodesRepository) {}

  /**
   * Generate and persist a new OTP code for the given user + type.
   * Returns the raw (plaintext) code to be sent to the user.
   *
   * Enforces a resend rate limit: max 1 request per minute.
   */
  async generate(params: { userId: string; type: OtpType }): Promise<string> {
    // Rate-limit check
    const recent = await this.otpCodesRepo.countRecentlyCreated({
      userId: params.userId,
      type: params.type,
      windowSeconds: OTP_RESEND_WINDOW_SECONDS,
    });

    if (recent >= OTP_MAX_PER_WINDOW) {
      throw new HttpException(
        'Please wait before requesting a new code',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const rawCode = this.generateNumericCode(OTP_LENGTH);
    await this.otpCodesRepo.create({
      userId: params.userId,
      code: rawCode,
      type: params.type,
      expiresIn: OTP_EXPIRY_SECONDS,
    });

    return rawCode;
  }

  /**
   * Validate a raw OTP code. Throws if invalid or expired.
   * Marks the code as used and deletes all codes of this type for the user.
   */
  async validate(params: {
    userId: string;
    rawCode: string;
    type: OtpType;
  }): Promise<OtpCodeDocument> {
    const record = await this.otpCodesRepo.findValidCode({
      userId: params.userId,
      rawCode: params.rawCode.trim(),
      type: params.type,
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Invalidate immediately to prevent replay
    await this.otpCodesRepo.markAsUsed(record._id as unknown as string);
    await this.otpCodesRepo.deleteByUserAndType({
      userId: params.userId,
      type: params.type,
    });

    return record;
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private generateNumericCode(length: number): string {
    const max = Math.pow(10, length);
    const min = Math.pow(10, length - 1);
    const code = Math.floor(Math.random() * (max - min)) + min;
    return code.toString();
  }
}
