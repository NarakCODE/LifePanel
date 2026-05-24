import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersRepository } from './users.repository';
import { UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async findById(id: string | Types.ObjectId): Promise<UserDocument> {
    const user = await this.usersRepo.findById(id);
    if (!user) {
      throw new NotFoundException(`User not found`);
    }
    return user;
  }

  async findByIds(ids: (string | Types.ObjectId)[]): Promise<UserDocument[]> {
    if (!ids.length) return [];
    return this.usersRepo.findByIds(ids);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.usersRepo.findByEmail(email);
  }

  async create(
    dto: CreateUserDto & { passwordHash: string },
  ): Promise<UserDocument> {
    return this.usersRepo.create(dto);
  }

  async markEmailVerified(id: string | Types.ObjectId): Promise<void> {
    return this.usersRepo.markEmailVerified(id);
  }

  async updateWorkspacePreferences(
    id: string | Types.ObjectId,
    update: {
      defaultWorkspaceId?: string | Types.ObjectId | null;
      activeWorkspaceId?: string | Types.ObjectId | null;
    },
  ): Promise<void> {
    return this.usersRepo.updateWorkspacePreferences(id, update);
  }

  async updateProfile(
    id: string | Types.ObjectId,
    update: {
      displayName?: string;
      avatarUrl?: string | null;
      profileMetadata?: Record<string, string>;
    },
  ): Promise<void> {
    return this.usersRepo.updateProfile(id, update);
  }

  async updatePassword(
    id: string | Types.ObjectId,
    passwordHash: string,
  ): Promise<void> {
    return this.usersRepo.updatePassword(id, passwordHash);
  }

  async updateEmail(id: string | Types.ObjectId, email: string): Promise<void> {
    return this.usersRepo.updateEmail(id, email);
  }

  async setLastLogin(id: string | Types.ObjectId, when?: Date): Promise<void> {
    return this.usersRepo.setLastLogin(id, when);
  }

  async incrementTokenVersion(
    id: string | Types.ObjectId,
    delta = 1,
  ): Promise<number> {
    return this.usersRepo.incrementTokenVersion(id, delta);
  }

  async markDeleted(id: string | Types.ObjectId): Promise<void> {
    return this.usersRepo.markDeleted(id);
  }
}
