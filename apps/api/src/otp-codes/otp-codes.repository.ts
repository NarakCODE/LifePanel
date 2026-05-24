import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OtpCode, OtpCodeDocument, OtpType } from './schemas/otp-code.schema';
import * as crypto from 'crypto';

/**
 * Encapsulates all Mongoose queries for OtpCodes (arch-use-repository-pattern).
 */
@Injectable()
export class OtpCodesRepository {
  constructor(
    @InjectModel(OtpCode.name)
    private readonly otpCodeModel: Model<OtpCodeDocument>,
  ) {}

  /**
   * Create a new OTP code. The raw `code` is SHA-256 hashed before storage.
   */
  async create(params: {
    userId: string | Types.ObjectId;
    code: string;
    type: OtpType;
    expiresIn: number; // seconds
  }): Promise<OtpCodeDocument> {
    const codeHash = this.hashCode(params.code);
    const expiresAt = new Date(Date.now() + params.expiresIn * 1000);

    const doc = new this.otpCodeModel({
      userId: new Types.ObjectId(params.userId.toString()),
      code: codeHash,
      type: params.type,
      expiresAt,
    });
    return doc.save();
  }

  /**
   * Find a valid (non-expired, non-used) OTP code for the given user matching
   * the provided raw code and type.
   */
  async findValidCode(params: {
    userId: string | Types.ObjectId;
    rawCode: string;
    type: OtpType;
  }): Promise<OtpCodeDocument | null> {
    const codeHash = this.hashCode(params.rawCode);
    return this.otpCodeModel
      .findOne({
        userId: new Types.ObjectId(params.userId.toString()),
        code: codeHash,
        type: params.type,
        usedAt: null,
        expiresAt: { $gt: new Date() },
      })
      .exec();
  }

  /**
   * Mark a code as used so it cannot be replayed.
   */
  async markAsUsed(id: string | Types.ObjectId): Promise<void> {
    await this.otpCodeModel
      .findByIdAndUpdate(id, { usedAt: new Date() })
      .exec();
  }

  /**
   * Delete all OTP codes of a given type for a user (cleanup after verification).
   */
  async deleteByUserAndType(params: {
    userId: string | Types.ObjectId;
    type: OtpType;
  }): Promise<void> {
    await this.otpCodeModel
      .deleteMany({
        userId: new Types.ObjectId(params.userId.toString()),
        type: params.type,
      })
      .exec();
  }

  /**
   * Check how many unused codes of a type were created for the user in the last
   * N seconds (for rate-limit / abuse prevention).
   */
  async countRecentlyCreated(params: {
    userId: string | Types.ObjectId;
    type: OtpType;
    windowSeconds: number;
  }): Promise<number> {
    const since = new Date(Date.now() - params.windowSeconds * 1000);
    return this.otpCodeModel
      .countDocuments({
        userId: new Types.ObjectId(params.userId.toString()),
        type: params.type,
        createdAt: { $gte: since },
      })
      .exec();
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private hashCode(rawCode: string): string {
    return crypto.createHash('sha256').update(rawCode).digest('hex');
  }
}
