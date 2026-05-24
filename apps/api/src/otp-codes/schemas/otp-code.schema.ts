import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OtpCodeDocument = HydratedDocument<OtpCode>;

export enum OtpType {
  EMAIL_VERIFY = 'email_verify',
  PASSWORD_RESET = 'password_reset',
  TWO_FACTOR = '2fa',
  PHONE_VERIFY = 'phone_verify',
}

@Schema({ timestamps: true, collection: 'otp_codes' })
export class OtpCode {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, length: 6 })
  code!: string;

  @Prop({ required: true, enum: Object.values(OtpType) })
  type!: OtpType;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: null })
  usedAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const OtpCodeSchema = SchemaFactory.createForClass(OtpCode);

OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpCodeSchema.index({ userId: 1, type: 1, usedAt: 1 });
