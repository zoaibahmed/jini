import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { redisConnection, Worker } from './worker.config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class ReminderWorker implements OnModuleInit, OnModuleDestroy {
  private worker: any;
  private readonly logger = new Logger('ReminderJobProcessor');

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly whatsappService: WhatsappService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      'reminders',
      async (job: Job) => {
        this.logger.log(`Processing Reminder Job ID=${job.id} Name=${job.name}...`);
        
        const { userId, recipientEmail, recipientPhone, message, title, type } = job.data;

        // 1. Dispatch Email if email target is specified
        if (recipientEmail) {
          try {
            await this.emailService.queueEmail(recipientEmail, title || 'Reminder Alert', message, type || 'RENEWAL_REM');
            this.logger.log(`Dispatched reminder email to ${recipientEmail}`);
          } catch (err: any) {
            this.logger.error(`Failed to dispatch reminder email: ${err.message}`);
          }
        }

        // 2. Dispatch SMS and WhatsApp if phone target is specified
        if (recipientPhone) {
          try {
            await this.smsService.queueSms(recipientPhone, message, type || 'RENEWAL_REMINDER');
            this.logger.log(`Dispatched reminder SMS to ${recipientPhone}`);
          } catch (err: any) {
            this.logger.error(`Failed to dispatch reminder SMS: ${err.message}`);
          }

          try {
            await this.whatsappService.sendWhatsAppMessage(recipientPhone, message || 'You have a new reminder from JINI Solutions.', undefined);
            this.logger.log(`Dispatched reminder WhatsApp to ${recipientPhone}`);
          } catch (err: any) {
            this.logger.error(`Failed to dispatch reminder WhatsApp: ${err.message}`);
          }
        }

        // 3. Create in-app notification if userId is specified
        if (userId) {
          try {
            await this.prisma.notification.create({
              data: {
                userId,
                title: title || 'Reminder',
                message,
                body: message,
                type: 'WARNING',
                channel: 'IN_APP',
                status: 'SENT',
                readAt: null,
              }
            });
            this.logger.log(`Dispatched in-app reminder notification to userId=${userId}`);
          } catch (err: any) {
            this.logger.error(`Failed to dispatch in-app notification: ${err.message}`);
          }
        }

        return { status: 'PROCESSED' };
      },
      {
        connection: redisConnection,
        concurrency: 5,
      }
    );
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
