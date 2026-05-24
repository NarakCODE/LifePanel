import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TaskNotificationsListener } from './listeners/task-notifications.listener';
import { IssueNotificationsListener } from './listeners/issue-notifications.listener';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { NotificationSeeder } from './seeds/notification-seeder';

@Module({
  imports: [
    WorkspacesModule,
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsRepository,
    NotificationsService,
    TaskNotificationsListener,
    IssueNotificationsListener,
    NotificationSeeder,
  ],
  exports: [NotificationsService, NotificationsRepository, NotificationSeeder],
})
export class NotificationsModule {}
