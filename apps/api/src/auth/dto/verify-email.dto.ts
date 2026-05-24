import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address to verify',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '482910',
    description: '6-digit verification code from the email',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code!: string;
}

export class ResendVerificationDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address to resend the verification code to',
  })
  @IsEmail()
  email!: string;
}
