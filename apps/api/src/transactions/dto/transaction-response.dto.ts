import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  TransactionCategory,
  TransactionType,
} from '../schemas/transaction.schema';

@Exclude()
export class TransactionResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  userId!: string;

  @Expose()
  @ApiProperty()
  budgetId?: string;

  @Expose()
  @ApiProperty()
  amount!: number;

  @Expose()
  @ApiProperty({ enum: TransactionType })
  type!: TransactionType;

  @Expose()
  @ApiProperty({ enum: TransactionCategory })
  category!: TransactionCategory;

  @Expose()
  @ApiProperty()
  description?: string;

  @Expose()
  @ApiProperty()
  date!: Date;

  @Expose()
  @ApiProperty()
  currency!: string;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  @Expose()
  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<TransactionResponseDto>) {
    Object.assign(this, partial);
  }
}
