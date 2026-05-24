import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  IsUrl,
  IsObject,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Jane Doe',
    description: 'Public display name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Link to an avatar image',
    nullable: true,
  })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Arbitrary profile metadata that can store future fields',
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  @IsOptional()
  @IsObject()
  profileMetadata?: Record<string, string>;
}
