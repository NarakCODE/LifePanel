import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { TransactionsRepository } from './transactions.repository';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [
    WorkspacesModule,
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsRepository, TransactionsService],
  exports: [TransactionsService, TransactionsRepository],
})
export class TransactionsModule {}
