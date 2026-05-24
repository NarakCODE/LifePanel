import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { BrevoEmailService } from './brevo-email.service';
import { emailConfig } from './email.config';

@Module({
  imports: [HttpModule, ConfigModule.forFeature(emailConfig)],
  providers: [BrevoEmailService],
  exports: [BrevoEmailService],
})
export class EmailModule {}
