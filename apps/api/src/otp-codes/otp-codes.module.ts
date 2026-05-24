import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpCode, OtpCodeSchema } from './schemas/otp-code.schema';
import { OtpCodesRepository } from './otp-codes.repository';
import { OtpCodesService } from './otp-codes.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OtpCode.name, schema: OtpCodeSchema }]),
  ],
  providers: [OtpCodesRepository, OtpCodesService],
  exports: [OtpCodesService, OtpCodesRepository],
})
export class OtpCodesModule {}
