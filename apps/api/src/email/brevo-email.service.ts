import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface SendEmailParams {
  to: { email: string; name?: string };
  subject: string;
  htmlContent: string;
  textContent?: string;
}

/**
 * Thin wrapper around the Brevo Transactional Emails API.
 * Uses the REST API directly via @nestjs/axios to avoid heavy SDK dependencies.
 *
 * Docs: https://developers.brevo.com/reference/sendtransacemail
 */
@Injectable()
export class BrevoEmailService {
  private readonly logger = new Logger(BrevoEmailService.name);
  private readonly apiUrl = 'https://api.brevo.com/v3/smtp/email';

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  async sendEmail(params: SendEmailParams): Promise<void> {
    const apiKey = this.config.get<string>('email.brevoApiKey', '');
    const senderEmail = this.config.get<string>('email.senderEmail');
    const senderName = this.config.get<string>('email.senderName');

    if (!apiKey) {
      this.logger.warn('BREVO_API_KEY is not configured — skipping email send');
      return;
    }

    const payload = {
      sender: { email: senderEmail, name: senderName },
      to: [{ email: params.to.email, name: params.to.name ?? params.to.email }],
      subject: params.subject,
      htmlContent: params.htmlContent,
      ...(params.textContent && { textContent: params.textContent }),
    };

    try {
      await firstValueFrom(
        this.httpService.post(this.apiUrl, payload, {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }),
      );
      this.logger.log(`Email sent to ${params.to.email}: "${params.subject}"`);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`Failed to send email to ${params.to.email}: ${msg}`);
      // We deliberately do NOT rethrow — email failures should not block the API
    }
  }

  // ── Canned templates ─────────────────────────────────────────────────────

  async sendEmailVerification(params: {
    to: { email: string; name: string };
    code: string;
  }): Promise<void> {
    // Helpful dev logging bypass
    const nodeEnv = this.config.get<string>(
      'app.nodeEnv',
      process.env.NODE_ENV || 'development',
    );
    if (nodeEnv !== 'production') {
      this.logger.log(
        `\n=========================================\n` +
          `[DEV MODE] OTP for ${params.to.email}\n` +
          `VERIFICATION CODE: ${params.code}\n` +
          `=========================================\n`,
      );
    }
    const appUrl = this.config.get<string>(
      'email.appUrl',
      'http://localhost:3000',
    );

    await this.sendEmail({
      to: params.to,
      subject: 'Verify your email address',
      htmlContent: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="color:#1a1a2e">Verify your email</h2>
          <p>Hi <strong>${params.to.name}</strong>,</p>
          <p>Use the code below to verify your email address. It expires in <strong>15 minutes</strong>.</p>
          <div style="background:#f4f4f4;border-radius:8px;padding:24px;text-align:center;font-size:36px;font-weight:700;letter-spacing:8px;color:#1a1a2e">
            ${params.code}
          </div>
          <p style="color:#666;font-size:13px;margin-top:24px">
            If you didn't create an account at <a href="${appUrl}">${appUrl}</a>,
            you can safely ignore this email.
          </p>
        </div>
      `,
      textContent: `Your Life Dashboard verification code is: ${params.code}\n\nIt expires in 15 minutes.`,
    });
  }
}
