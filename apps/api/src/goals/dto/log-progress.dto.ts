import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LogProgressDto {
  @ApiProperty({ example: 25, description: 'Progress value to add' })
  @IsNumber()
  @Min(0)
  value!: number;

  @ApiPropertyOptional({
    example: 'Completed 5km run today',
    description: 'Optional note for this progress log',
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  note?: string;
}
