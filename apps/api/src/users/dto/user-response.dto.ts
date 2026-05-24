import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserOnboardingSummaryDto } from '../../common/dto/user-onboarding-summary.dto';

/**
 * Safe public representation of a User — excludes sensitive fields.
 * Use with ClassSerializerInterceptor.
 */
@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  email!: string;

  @Expose()
  @ApiProperty()
  displayName!: string;

  @Expose()
  @ApiProperty({ description: 'Whether the user has verified their email' })
  isEmailVerified!: boolean;

  @Expose()
  @ApiProperty({ required: false, nullable: true })
  defaultWorkspaceId?: string | null;

  @Expose()
  @ApiProperty({ required: false, nullable: true })
  activeWorkspaceId?: string | null;

  @Expose()
  @ApiProperty({ type: () => UserOnboardingSummaryDto })
  onboarding!: UserOnboardingSummaryDto;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  @Expose()
  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
