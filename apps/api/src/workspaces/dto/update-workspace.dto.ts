import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWorkspaceDto {
  @ApiProperty({
    example: 'Family Chores',
    description: 'The new name of the workspace',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;
}
