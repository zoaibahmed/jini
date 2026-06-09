// reminder.service.ts
import { Injectable } from '@nestjs/common';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { Queues } from '../workers/worker.config';
import { REMINDER_QUEUE } from '../queues/queue.constants';

@Injectable()
export class ReminderService {
  async createReminder(dto: CreateReminderDto) {
    const delay = Math.max(0, new Date(dto.remindAt).getTime() - Date.now());
    await Queues[REMINDER_QUEUE].add(
      'reminder',
      {
        userId: dto.userId,
        recipientEmail: dto.recipientEmail,
        recipientPhone: dto.recipientPhone,
        message: dto.message || dto.description || '',
        title: dto.title,
        type: 'RENEWAL_REMINDER',
      },
      { delay }
    );
    return { success: true, data: dto };
  }
}

