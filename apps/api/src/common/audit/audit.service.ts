import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface AuditRecord {
  userId: string;
  action: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly events: EventEmitter2) {}

  log(userId: string, action: string, metadata?: Record<string, unknown>) {
    const record: AuditRecord = { userId, action, metadata };
    this.logger.log(`${action} for ${userId}`, 'audit');
    this.events.emit('audit.log', record);
  }
}
