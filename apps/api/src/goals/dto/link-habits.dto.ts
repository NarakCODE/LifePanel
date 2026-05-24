import { IsArray, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkHabitsDto {
  @ApiProperty({
    type: [String],
    description: 'Habit IDs to link to this goal',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  habitIds!: string[];
}
