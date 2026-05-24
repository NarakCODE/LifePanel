import {
  IsString,
  IsOptional,
  IsEnum,
  IsDate,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TransactionCategory,
  TransactionType,
} from '../schemas/transaction.schema';

export class CreateTransactionDto {
  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsOptional()
  budgetId?: string;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ enum: TransactionType, example: 'expense' })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiProperty({
    enum: TransactionCategory,
    default: TransactionCategory.OTHER,
  })
  @IsEnum(TransactionCategory)
  category!: TransactionCategory;

  @ApiPropertyOptional({ example: 'Grocery shopping' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2026-03-20T00:00:00Z' })
  @IsDate()
  @Type(() => Date)
  date!: Date;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsString()
  @MaxLength(3)
  @IsOptional()
  currency?: string;
}
