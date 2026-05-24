import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument, MessageType } from './schemas/message.schema';
import { InboxItem, InboxItemDocument } from './schemas/inbox-item.schema';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { SendMessageDto, SendAnnouncementDto } from './dto/send-message.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { QueryInboxDto, UpdateInboxItemDto, InboxItemResponseDto } from './dto/inbox-query.dto';
import { UsersService } from '../users/users.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class InboxService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(InboxItem.name) private inboxItemModel: Model<InboxItemDocument>,
    private readonly usersService: UsersService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async sendMessage(
    workspace: WorkspaceRequestContext,
    dto: SendMessageDto,
  ): Promise<MessageDocument> {
    if (!workspace) {
      throw new Error('Workspace context is required');
    }
    const threadId = dto.replyToId ? new Types.ObjectId(dto.replyToId) : new Types.ObjectId();

    const message = await this.messageModel.create({
      senderId: new Types.ObjectId(workspace.actorUserId),
      workspaceId: workspace?.workspaceId ? new Types.ObjectId(workspace.workspaceId) : null,
      subject: dto.subject,
      body: dto.body,
      contentJson: dto.contentJson,
      type: dto.type ?? MessageType.USER_MESSAGE,
      threadId,
      metadata: dto.metadata ?? {},
    });

    const inboxItems = dto.recipientIds.map((recipientId) => ({
      userId: new Types.ObjectId(recipientId),
      messageId: message._id,
      workspaceId: message.workspaceId,
      isRead: false,
      isArchived: false,
    }));

    await this.inboxItemModel.insertMany(inboxItems);

    return message;
  }

  async sendAnnouncement(
    workspace: WorkspaceRequestContext,
  ): Promise<MessageDocument> {
    if (!workspace?.workspaceId) {
      throw new Error('Workspace context required for announcements');
    }

    // Fetch all members of the workspace
    const workspaceDetails = await this.workspacesService.findOne(workspace?.workspaceId);
    const members = workspaceDetails.members;
    
    const message = await this.messageModel.create({
      senderId: new Types.ObjectId(workspace.actorUserId),
      workspaceId: new Types.ObjectId(workspace.workspaceId),
      subject: 'Workspace Announcement',
      body: 'Welcome to the workspace!',
      contentJson: null,
      type: MessageType.ANNOUNCEMENT,
      threadId: new Types.ObjectId(),
    });

    const inboxItems = members.map((member: any) => ({
      userId: new Types.ObjectId(member.userId),
      messageId: message._id,
      workspaceId: message.workspaceId,
      isRead: false,
      isArchived: false,
    }));

    await this.inboxItemModel.insertMany(inboxItems);

    return message;
  }

  // Simplified version for the task
  async listInbox(
    workspace: WorkspaceRequestContext,
    query: QueryInboxDto,
  ): Promise<{ items: InboxItemResponseDto[]; total: number }> {
    if (!workspace) {
      throw new Error('Workspace context is required');
    }
    const filter: any = {
      userId: new Types.ObjectId(workspace.actorUserId),
      isArchived: query.isArchived ?? false,
    };

    if (query.isRead !== undefined) {
      filter.isRead = query.isRead;
    }

    if (query.label) {
      filter.labels = query.label;
    }

    const total = await this.inboxItemModel.countDocuments(filter);
    const items = await this.inboxItemModel
      .find(filter)
      .populate('messageId')
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .exec();

    const result = await Promise.all(items.map(async (item) => {
      const msg = item.messageId as any;
      if (!msg || !msg.senderId) return null;

      try {
        const sender = await this.usersService.findById(msg.senderId);
        
        return new InboxItemResponseDto({
          id: item._id.toString(),
          messageId: msg._id ? msg._id.toString() : msg.toString(),
          subject: msg.subject || '',
          body: msg.body || '',
          senderId: msg.senderId.toString(),
          senderName: sender?.displayName || 'Unknown',
          type: msg.type || MessageType.USER_MESSAGE,
          isRead: item.isRead,
          isArchived: item.isArchived,
          snoozedUntil: item.snoozedUntil,
          labels: item.labels,
          createdAt: item.createdAt,
        });
      } catch (error) {
        return null;
      }
    }));

    return { items: result.filter((i): i is InboxItemResponseDto => i !== null), total };
  }

  async updateInboxItem(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateInboxItemDto,
  ): Promise<InboxItemDocument> {
    if (!workspace) {
      throw new Error('Workspace context is required');
    }
    const item = await this.inboxItemModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(workspace.actorUserId),
    });

    if (!item) {
      throw new NotFoundException('Inbox item not found');
    }

    if (dto.isRead !== undefined) {
      item.isRead = dto.isRead;
      item.readAt = dto.isRead ? new Date() : null;
    }
    if (dto.isArchived !== undefined) item.isArchived = dto.isArchived;
    if (dto.snoozedUntil !== undefined) {
      item.snoozedUntil = dto.snoozedUntil ? new Date(dto.snoozedUntil) : null;
    }
    if (dto.labels !== undefined) item.labels = dto.labels;

    return item.save();
  }
}
