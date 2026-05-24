import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  JournalEntry,
  JournalEntrySchema,
} from './schemas/journal-entry.schema';
import { JournalEntriesRepository } from './journal-entries.repository';
import { JournalEntriesService } from './journal-entries.service';
import { JournalEntriesController } from './journal-entries.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [
    WorkspacesModule,
    MongooseModule.forFeature([
      { name: JournalEntry.name, schema: JournalEntrySchema },
    ]),
  ],
  controllers: [JournalEntriesController],
  providers: [JournalEntriesRepository, JournalEntriesService],
  exports: [JournalEntriesService, JournalEntriesRepository],
})
export class JournalEntriesModule {}
