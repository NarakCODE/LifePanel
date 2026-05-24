import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional, MaxLength } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Current password for confirmation',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    description: 'Optional reason for analytics/audit purposes',
    maxLength: 256,
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  reason?: string;
}
