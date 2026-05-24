import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  TransactionCategory,
  TransactionType,
} from '../schemas/transaction.schema';

export class QueryTransactionDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TransactionType })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiPropertyOptional({ enum: TransactionCategory })
  @IsEnum(TransactionCategory)
  @IsOptional()
  category?: TransactionCategory;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsOptional()
  budgetId?: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsString()
  @MaxLength(3)
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Filter transactions from this date onwards',
    example: '2026-03-01T00:00:00Z',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dateFrom?: Date;

  @ApiPropertyOptional({
    description: 'Filter transactions up to this date',
    example: '2026-03-31T00:00:00Z',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dateTo?: Date;
}
