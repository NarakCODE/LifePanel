import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Exclude } from 'class-transformer';

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING_DELETION = 'pending_deletion',
  DELETED = 'deleted',
}

export type UserDocument = HydratedDocument<User> & {
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true, lowercase: true })
  email!: string;

  @Prop({
    type: [String],
    enum: Object.values(UserRole),
    default: [UserRole.MEMBER],
  })
  roles!: UserRole[];

  @Prop({ required: true })
  @Exclude()
  passwordHash!: string;

  @Prop({ required: true })
  displayName!: string;

  @Prop({ default: null, type: String })
  @Exclude()
  refreshTokenHash!: string | null;

  /**
   * Whether the user has verified their email address.
   * Unverified users cannot log in.
   */
  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({ default: null, type: String })
  avatarUrl?: string | null;

  @Prop({ type: Object, default: {} })
  profileMetadata?: Record<string, string>;

  @Prop({
    default: UserStatus.ACTIVE,
    enum: Object.values(UserStatus),
  })
  status!: UserStatus;

  @Prop({ default: null, type: Date })
  lastLogin?: Date | null;

  @Prop({ default: 0 })
  tokenVersion!: number;

  @Prop({ default: null, type: Date })
  deletedAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', default: null, index: true })
  defaultWorkspaceId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', default: null, index: true })
  activeWorkspaceId?: Types.ObjectId | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
