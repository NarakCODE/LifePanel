import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionsService } from './transactions.service';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { WorkspacePermissionGuard } from '../workspaces/guards/workspace-permission.guard';
import { WorkspaceContext } from '../workspaces/decorators/workspace-context.decorator';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { RequireWorkspacePermission } from '../workspaces/decorators/require-workspace-permission.decorator';
import { WorkspacePermission } from '../workspaces/workspace-permissions';

@ApiTags('transactions')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'x-workspace-id',
  required: false,
  description: 'Workspace context for workspace-scoped transaction routes',
})
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard, WorkspacePermissionGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @RequireWorkspacePermission(WorkspacePermission.TRANSACTION_WRITE)
  @ApiOperation({ summary: 'Create a transaction' })
  @ApiCreatedResponse({ description: 'The created transaction object' })
  create(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(workspace, createTransactionDto);
  }

  @Get()
  @RequireWorkspacePermission(WorkspacePermission.TRANSACTION_READ)
  @ApiOperation({ summary: 'Get transactions with pagination and filters' })
  @ApiOkResponse({
    description: 'The list of matching transactions and pagination data',
  })
  findAll(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() queryTransactionDto: QueryTransactionDto,
  ) {
    return this.transactionsService.findMany(workspace, queryTransactionDto);
  }

  @Get('summary')
  @RequireWorkspacePermission(WorkspacePermission.TRANSACTION_READ)
  @ApiOperation({
    summary: 'Get a transaction summary for the current filters',
  })
  @ApiOkResponse({ description: 'Income, expense, net and grouped totals' })
  getSummary(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() queryTransactionDto: QueryTransactionDto,
  ) {
    return this.transactionsService.getSummary(workspace, queryTransactionDto);
  }

  @Get(':id')
  @RequireWorkspacePermission(WorkspacePermission.TRANSACTION_READ)
  @ApiOperation({ summary: 'Get a specific transaction by ID' })
  @ApiOkResponse({ description: 'The requested transaction' })
  findOne(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.transactionsService.findByIdAndUser(id, workspace);
  }

  @Patch(':id')
  @RequireWorkspacePermission(WorkspacePermission.TRANSACTION_WRITE)
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiOkResponse({ description: 'The updated transaction' })
  update(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, workspace, updateTransactionDto);
  }

  @Delete(':id')
  @RequireWorkspacePermission(WorkspacePermission.TRANSACTION_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiOkResponse({ description: 'Transaction successfully deleted' })
  remove(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.transactionsService.delete(id, workspace);
  }
}
