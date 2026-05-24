import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectPriority, ProjectStatus } from '../schemas/project.schema';

export class CreateProjectWorkstreamDto {
  @ApiProperty({ example: 'Initial discovery & alignment' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ example: 0 })
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  order?: number;
}

export class CreateProjectDto {
  @ApiProperty({ example: 'Fintech Mobile App Redesign' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiPropertyOptional({
    enum: ProjectPriority,
    default: ProjectPriority.MEDIUM,
  })
  @IsEnum(ProjectPriority)
  @IsOptional()
  priority?: ProjectPriority;

  @ApiPropertyOptional({ example: 'MVP' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  typeLabel?: string;

  @ApiPropertyOptional({ example: '2 weeks' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  durationLabel?: string;

  @ApiPropertyOptional({
    description: 'Optional project member user ids.',
    type: [String],
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  memberUserIds?: string[];

  @ApiPropertyOptional({ type: [CreateProjectWorkstreamDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectWorkstreamDto)
  @IsOptional()
  workstreams?: CreateProjectWorkstreamDto[];
}
