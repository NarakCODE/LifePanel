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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceContext } from '../workspaces/decorators/workspace-context.decorator';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { InboxService } from './inbox.service';
import { SendMessageDto, SendAnnouncementDto } from './dto/send-message.dto';
import { QueryInboxDto, UpdateInboxItemDto } from './dto/inbox-query.dto';

@ApiTags('inbox')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard)
@Controller('inbox')
export class InboxController {
  constructor(private readonly inboxService: InboxService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a message to users' })
  sendMessage(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() dto: SendMessageDto,
  ) {
    return this.inboxService.sendMessage(workspace, dto);
  }

  @Post('announcement')
  @ApiOperation({ summary: 'Send an announcement to all workspace members' })
  sendAnnouncement(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.inboxService.sendAnnouncement(workspace);
  }

  @Get()
  @ApiOperation({ summary: 'List user inbox items' })
  listInbox(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() query: QueryInboxDto,
  ) {
    return this.inboxService.listInbox(workspace, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update inbox item status (read, archive, snooze)' })
  updateInboxItem(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() dto: UpdateInboxItemDto,
  ) {
    return this.inboxService.updateInboxItem(id, workspace, dto);
  }
}
