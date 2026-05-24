import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class UpdateEmailDto {
  @ApiProperty({
    description: 'Current password for confirmation',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ description: 'New email address' })
  @IsEmail()
  newEmail!: string;
}
