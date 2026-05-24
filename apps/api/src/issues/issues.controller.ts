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
  ApiExtraModels,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceContext } from '../workspaces/decorators/workspace-context.decorator';
import { RequireWorkspacePermission } from '../workspaces/decorators/require-workspace-permission.decorator';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { WorkspacePermissionGuard } from '../workspaces/guards/workspace-permission.guard';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { WorkspacePermission } from '../workspaces/workspace-permissions';
import { CreateIssueDto } from './dto/create-issue.dto';
import { IssueListResultDto, IssueResponseDto } from './dto/issue-response.dto';
import { QueryIssueDto } from './dto/query-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { IssuesService } from './issues.service';

@ApiTags('issues')
@ApiExtraModels(IssueResponseDto, IssueListResultDto)
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'x-workspace-id',
  required: false,
  description: 'Workspace context for workspace-scoped issue routes',
})
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard, WorkspacePermissionGuard)
@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  @RequireWorkspacePermission(WorkspacePermission.ISSUE_WRITE)
  @ApiOperation({ summary: 'Create a new issue' })
  @ApiCreatedResponse({
    description: 'The created issue object',
    type: IssueResponseDto,
  })
  create(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() createIssueDto: CreateIssueDto,
  ) {
    return this.issuesService.create(workspace, createIssueDto);
  }

  @Get('my-issues')
  @RequireWorkspacePermission(WorkspacePermission.ISSUE_READ)
  @ApiOperation({
    summary: 'Get issues assigned to the authenticated user in the workspace',
  })
  @ApiOkResponse({
    description: 'Filtered issue list for the current assignee',
    type: IssueListResultDto,
  })
  getMyIssues(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() queryIssueDto: QueryIssueDto,
  ) {
    return this.issuesService.getMyIssues(workspace, queryIssueDto);
  }

  @Get()
  @RequireWorkspacePermission(WorkspacePermission.ISSUE_READ)
  @ApiOperation({
    summary: 'Get workspace issues with pagination and filtering',
  })
  @ApiOkResponse({
    description: 'Workspace issue list and pagination metadata',
    type: IssueListResultDto,
  })
  findAll(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() queryIssueDto: QueryIssueDto,
  ) {
    return this.issuesService.findMany(workspace, queryIssueDto);
  }

  @Get(':id')
  @RequireWorkspacePermission(WorkspacePermission.ISSUE_READ)
  @ApiOperation({ summary: 'Get a single issue by id' })
  @ApiOkResponse({
    description: 'The requested issue object',
    type: IssueResponseDto,
  })
  findOne(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.issuesService.findById(id, workspace);
  }

  @Patch(':id')
  @RequireWorkspacePermission(WorkspacePermission.ISSUE_WRITE)
  @ApiOperation({ summary: 'Update an issue' })
  @ApiOkResponse({
    description: 'The updated issue object',
    type: IssueResponseDto,
  })
  update(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() updateIssueDto: UpdateIssueDto,
  ) {
    return this.issuesService.update(id, workspace, updateIssueDto);
  }

  @Delete(':id')
  @RequireWorkspacePermission(WorkspacePermission.ISSUE_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an issue' })
  @ApiOkResponse({ description: 'Issue successfully deleted' })
  remove(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.issuesService.delete(id, workspace);
  }
}
