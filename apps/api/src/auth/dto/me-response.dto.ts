import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserOnboardingSummaryDto } from '../../common/dto/user-onboarding-summary.dto';
import { UserRole, UserStatus } from '../../users/schemas/user.schema';

@Exclude()
export class IdentityDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  email!: string;

  @Expose()
  @ApiProperty({ enum: Object.values(UserRole), isArray: true })
  roles!: UserRole[];

  @Expose()
  @ApiProperty({ description: 'Whether the user has verified their email' })
  isEmailVerified!: boolean;

  constructor(partial: Partial<IdentityDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class ProfileDto {
  @Expose()
  @ApiProperty()
  displayName!: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  avatarUrl?: string | null;

  @Expose()
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'Optional profile metadata for future fields',
  })
  profileMetadata?: Record<string, string>;

  constructor(partial: Partial<ProfileDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class AccountMetadataDto {
  @Expose()
  @ApiProperty({ enum: Object.values(UserStatus) })
  status!: UserStatus;

  @Expose()
  @ApiProperty({ type: Date })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ type: Date })
  updatedAt!: Date;

  @Expose()
  @ApiPropertyOptional({ description: 'Last login timestamp' })
  lastLogin?: Date | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  defaultWorkspaceId?: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  activeWorkspaceId?: string | null;

  @Expose()
  @Type(() => UserOnboardingSummaryDto)
  @ApiProperty({ type: () => UserOnboardingSummaryDto })
  onboarding!: UserOnboardingSummaryDto;

  constructor(partial: Partial<AccountMetadataDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class MeResponseDto {
  @Expose()
  @Type(() => IdentityDto)
  @ApiProperty({ type: () => IdentityDto })
  identity!: IdentityDto;

  @Expose()
  @Type(() => ProfileDto)
  @ApiProperty({ type: () => ProfileDto })
  profile!: ProfileDto;

  @Expose()
  @Type(() => AccountMetadataDto)
  @ApiProperty({ type: () => AccountMetadataDto })
  metadata!: AccountMetadataDto;

  constructor(partial: Partial<MeResponseDto>) {
    Object.assign(this, partial);
  }
}
