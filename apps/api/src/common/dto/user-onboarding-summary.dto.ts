import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export enum UserOnboardingStatus {
  COMPLETED = 'completed',
}

export class UserOnboardingSummaryDto {
  @Expose()
  @ApiProperty({
    enum: UserOnboardingStatus,
    enumName: 'UserOnboardingStatus',
  })
  status!: UserOnboardingStatus;

  @Expose()
  @ApiProperty()
  requiresOnboarding!: boolean;

  @Expose()
  @ApiProperty({
    required: false,
    nullable: true,
    type: String,
  })
  currentStep?: string | null;

  @Expose()
  @ApiProperty({ required: false, nullable: true })
  workspaceId?: string | null;

  constructor(partial: Partial<UserOnboardingSummaryDto>) {
    Object.assign(this, partial);
  }
}
