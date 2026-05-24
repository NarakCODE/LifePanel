import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../schemas/user.schema';

/**
 * Safe public representation of a User — excludes sensitive fields.
 * Use with ClassSerializerInterceptor.
 */
@Exclude()
export class UserPublicDto {
  @Expose()
  @ApiProperty({ description: 'User ID' })
  id!: string;

  @Expose()
  @ApiProperty({ description: 'User email address' })
  email!: string;

  @Expose()
  @ApiProperty({ description: 'User display name' })
  displayName!: string;

  @Expose()
  @ApiProperty({
    description: 'User roles',
    enum: UserRole,
    isArray: true,
  })
  roles!: UserRole[];

  @Expose()
  @ApiProperty({ description: 'Whether the user has verified their email' })
  isEmailVerified!: boolean;

  @Expose()
  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
  })
  status!: UserStatus;

  @Expose()
  @ApiPropertyOptional({ description: 'Avatar URL', nullable: true })
  avatarUrl?: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Profile metadata',
    additionalProperties: { type: 'string' },
  })
  profileMetadata?: Record<string, string>;

  @Expose()
  @ApiProperty({ description: 'Last login timestamp' })
  lastLogin?: Date | null;

  @Expose()
  @ApiProperty({ description: 'Account creation timestamp' })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  constructor(partial: Partial<UserPublicDto>) {
    Object.assign(this, partial);
  }
}
