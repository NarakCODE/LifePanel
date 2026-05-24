import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkspaceDto {
  @ApiProperty({
    example: 'Personal Life Dashboard',
    description: 'The name of the workspace',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}
