import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString, MaxLength } from 'class-validator';

export class ReorderProjectTasksDto {
  @ApiProperty({
    type: [String],
    description: 'Ordered task ids for the target list.',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  taskIds!: string[];
}
