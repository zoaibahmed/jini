// reminder.service.ts
import { Injectable } from '@nestjs/common';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { Queues } from '../workers/worker.config';
import { REMINDER_QUEUE } from '../queues/queue.constants';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReminderService {
  constructor(private readonly prisma: PrismaService) {}

  async createReminder(dto: CreateReminderDto) {
    let email = dto.recipientEmail;
    let phone = dto.recipientPhone;

    // Resolve user contact details if missing
    if (dto.userId && (!email || !phone)) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: dto.userId },
          select: { email: true, phone: true }
        });
        if (user) {
          if (!email) email = user.email;
          if (!phone) phone = user.phone || undefined;
        }
      } catch (err) {
        console.error('Failed to resolve user contact details for reminder:', err);
      }
    }

    const delay = Math.max(0, new Date(dto.remindAt).getTime() - Date.now());
    await Queues[REMINDER_QUEUE].add(
      'reminder',
      {
        userId: dto.userId,
        recipientEmail: email,
        recipientPhone: phone,
        message: dto.message || dto.description || '',
        title: dto.title,
        type: 'RENEWAL_REMINDER',
      },
      { delay }
    );
    return { success: true, data: { ...dto, recipientEmail: email, recipientPhone: phone } };
  }
}

