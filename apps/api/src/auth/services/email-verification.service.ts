import { Injectable } from '@nestjs/common';
import { BrevoEmailService } from '../../email/brevo-email.service';
import { OtpCodesService } from '../../otp-codes/otp-codes.service';
import { OtpType } from '../../otp-codes/schemas/otp-code.schema';
import { UserDocument } from '../../users/schemas/user.schema';

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly otpCodesService: OtpCodesService,
    private readonly emailService: BrevoEmailService,
  ) {}

  async sendVerificationEmail(user: UserDocument): Promise<void> {
    const rawCode = await this.otpCodesService.generate({
      userId: user._id.toString(),
      type: OtpType.EMAIL_VERIFY,
    });

    await this.emailService.sendEmailVerification({
      to: { email: user.email, name: user.displayName },
      code: rawCode,
    });
  }
}
