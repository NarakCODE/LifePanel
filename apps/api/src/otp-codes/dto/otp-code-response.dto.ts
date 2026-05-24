import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { OtpType } from '../schemas/otp-code.schema';

@Exclude()
export class OtpCodeResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  userId!: string;

  @Expose()
  @ApiProperty()
  code!: string;

  @Expose()
  @ApiProperty({ enum: OtpType })
  type!: OtpType;

  @Expose()
  @ApiProperty()
  expiresAt!: Date;

  @Expose()
  @ApiProperty()
  usedAt?: Date;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  @Expose()
  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<OtpCodeResponseDto>) {
    Object.assign(this, partial);
  }
}
