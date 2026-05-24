import { IsString, IsNotEmpty, IsEnum, IsDate, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { OtpType } from '../schemas/otp-code.schema';

export class CreateOtpCodeDto {
  @ApiProperty({ enum: OtpType })
  @IsEnum(OtpType)
  type!: OtpType;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code!: string;

  @ApiProperty({ example: '2026-03-21T12:00:00Z' })
  @IsDate()
  @Type(() => Date)
  expiresAt!: Date;
}
