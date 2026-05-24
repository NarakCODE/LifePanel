import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'The display name of the user',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'The avatar URL of the user',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string | null;
}
