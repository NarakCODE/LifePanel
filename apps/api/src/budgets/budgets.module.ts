import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Budget, BudgetSchema } from './schemas/budget.schema';
import { BudgetsRepository } from './budgets.repository';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [
    WorkspacesModule,
    MongooseModule.forFeature([{ name: Budget.name, schema: BudgetSchema }]),
  ],
  controllers: [BudgetsController],
  providers: [BudgetsRepository, BudgetsService],
  exports: [BudgetsService, BudgetsRepository],
})
export class BudgetsModule {}
