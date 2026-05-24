import { registerAs } from '@nestjs/config';

export const emailConfig = registerAs('email', () => ({
  brevoApiKey: process.env.BREVO_API_KEY ?? '',
  senderEmail: process.env.BREVO_SENDER_EMAIL ?? 'noreply@example.com',
  senderName: process.env.BREVO_SENDER_NAME ?? 'Life Dashboard',
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
}));
