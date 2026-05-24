import { ApiProperty } from '@nestjs/swagger';
import { TaskResponseDto } from '../../tasks/dto/task-response.dto';
import { IssueResponseDto } from '../../issues/dto/issue-response.dto';
import { TransactionResponseDto } from '../../transactions/dto/transaction-response.dto';
import { NoteResponseDto } from '../../notes/dto/note-response.dto';
import { JournalEntryResponseDto } from '../../journal-entries/dto/journal-entry-response.dto';
import { NotificationResponseDto } from '../../notifications/dto/notification-response.dto';

export class DashboardActivityResponseDto {
  @ApiProperty({ type: [TaskResponseDto] })
  recentTasks!: TaskResponseDto[];

  @ApiProperty({ type: [IssueResponseDto] })
  recentIssues!: IssueResponseDto[];

  @ApiProperty({ type: [TransactionResponseDto] })
  recentTransactions!: TransactionResponseDto[];

  @ApiProperty({ type: [NoteResponseDto] })
  recentNotes!: NoteResponseDto[];

  @ApiProperty({ type: [JournalEntryResponseDto] })
  recentJournalEntries!: JournalEntryResponseDto[];

  @ApiProperty({ type: [NotificationResponseDto] })
  recentNotifications!: NotificationResponseDto[];

  constructor(partial: Partial<DashboardActivityResponseDto>) {
    this.recentTasks = partial.recentTasks ?? [];
    this.recentIssues = partial.recentIssues ?? [];
    this.recentTransactions = partial.recentTransactions ?? [];
    this.recentNotes = partial.recentNotes ?? [];
    this.recentJournalEntries = partial.recentJournalEntries ?? [];
    this.recentNotifications = partial.recentNotifications ?? [];
  }
}
