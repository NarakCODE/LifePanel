import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { Message, MessageSchema } from './schemas/message.schema';
import { InboxItem, InboxItemSchema } from './schemas/inbox-item.schema';
import { UsersModule } from '../users/users.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: InboxItem.name, schema: InboxItemSchema },
    ]),
    UsersModule,
    WorkspacesModule,
  ],
  controllers: [InboxController],
  providers: [InboxService],
  exports: [InboxService],
})
export class InboxModule {}
