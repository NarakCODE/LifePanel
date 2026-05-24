import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  User,
  UserDocument,
  UserRole,
  UserStatus,
} from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

/**
 * Encapsulates all Mongoose queries for Users (arch-use-repository-pattern).
 */
@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByIds(ids: (string | Types.ObjectId)[]): Promise<UserDocument[]> {
    const objectIds = ids.map((id) =>
      id instanceof Types.ObjectId ? id : new Types.ObjectId(id),
    );
    return this.userModel.find({ _id: { $in: objectIds } }).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async create(
    dto: CreateUserDto & { passwordHash: string },
  ): Promise<UserDocument> {
    const user = new this.userModel({
      email: dto.email.toLowerCase(),
      passwordHash: dto.passwordHash,
      displayName: dto.displayName,
      isEmailVerified: false,
      roles: [UserRole.MEMBER],
    });
    return user.save();
  }

  async updateRefreshTokenHash(
    id: string | Types.ObjectId,
    refreshTokenHash: string,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { refreshTokenHash }).exec();
  }

  async clearRefreshToken(id: string | Types.ObjectId): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { refreshTokenHash: null })
      .exec();
  }

  /**
   * Mark a user's email as verified.
   */
  async markEmailVerified(id: string | Types.ObjectId): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { isEmailVerified: true })
      .exec();
  }

  async updatePassword(
    id: string | Types.ObjectId,
    passwordHash: string,
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { passwordHash, refreshTokenHash: null })
      .exec();
  }

  async updateEmail(id: string | Types.ObjectId, email: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, {
        email: email.toLowerCase(),
        isEmailVerified: false,
        refreshTokenHash: null,
      })
      .exec();
  }

  async setLastLogin(
    id: string | Types.ObjectId,
    timestamp?: Date,
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { lastLogin: timestamp ?? new Date() })
      .exec();
  }

  async incrementTokenVersion(
    id: string | Types.ObjectId,
    delta = 1,
  ): Promise<number> {
    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        { $inc: { tokenVersion: delta } },
        { new: true, select: 'tokenVersion' },
      )
      .exec();

    return user?.tokenVersion ?? 0;
  }

  async markDeleted(id: string | Types.ObjectId): Promise<void> {
    const user = await this.userModel.findById(id).exec();
    if (!user) return;

    await this.userModel.findByIdAndUpdate(id, {
      status: UserStatus.DELETED,
      email: `${user.email}.deleted.${Date.now()}`,
      deletedAt: new Date(),
      refreshTokenHash: null,
      isEmailVerified: false,
    });
  }

  async updateWorkspacePreferences(
    id: string | Types.ObjectId,
    update: {
      defaultWorkspaceId?: string | Types.ObjectId | null;
      activeWorkspaceId?: string | Types.ObjectId | null;
    },
  ): Promise<void> {
    const normalizedUpdate: Record<string, Types.ObjectId | null> = {};

    if (update.defaultWorkspaceId !== undefined) {
      normalizedUpdate.defaultWorkspaceId = update.defaultWorkspaceId
        ? this.toObjectId(update.defaultWorkspaceId)
        : null;
    }

    if (update.activeWorkspaceId !== undefined) {
      normalizedUpdate.activeWorkspaceId = update.activeWorkspaceId
        ? this.toObjectId(update.activeWorkspaceId)
        : null;
    }

    await this.userModel.findByIdAndUpdate(id, normalizedUpdate).exec();
  }

  async updateProfile(
    id: string | Types.ObjectId,
    update: {
      displayName?: string;
      avatarUrl?: string | null;
      profileMetadata?: Record<string, string>;
    },
  ): Promise<void> {
    const updateData: Record<string, unknown> = {};

    if (update.displayName !== undefined) {
      updateData.displayName = update.displayName;
    }
    if (update.avatarUrl !== undefined) {
      updateData.avatarUrl = update.avatarUrl;
    }
    if (update.profileMetadata !== undefined) {
      updateData.profileMetadata = update.profileMetadata;
    }

    if (Object.keys(updateData).length > 0) {
      await this.userModel.findByIdAndUpdate(id, { $set: updateData }).exec();
    }
  }

  private toObjectId(value: string | Types.ObjectId): Types.ObjectId {
    return value instanceof Types.ObjectId ? value : new Types.ObjectId(value);
  }
}
