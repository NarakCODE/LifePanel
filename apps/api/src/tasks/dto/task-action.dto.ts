import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class MoveTaskDto {
  @ApiProperty({ example: 'project-fintech-redesign' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  projectId!: string;

  @ApiPropertyOptional({ example: 'ws-discovery' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  workstreamId?: string;

  @ApiPropertyOptional({
    description: 'Optional insertion order in the target project/workstream.',
    example: 3,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  targetOrder?: number;
}

export class DuplicateTaskDto {
  @ApiPropertyOptional({
    description: 'Optional name for the duplicated task.',
    example: 'Design system setup copy',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'Optional target project id. Defaults to the source project.',
    example: 'project-fintech-redesign',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  projectId?: string;

  @ApiPropertyOptional({
    description:
      'Optional target workstream id. Defaults to the source workstream.',
    example: 'ws-discovery',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  workstreamId?: string;
}

export class AddTaskCommentDto {
  @ApiProperty({ example: 'Please review @alex before launch.' })
  @IsString()
  @IsNotEmpty()
  markdown!: string;

  @ApiPropertyOptional({
    description: 'Mentioned user ids.',
    type: [String],
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  mentionIds?: string[];
}
