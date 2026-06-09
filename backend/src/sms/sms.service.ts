import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Queues } from '../workers/worker.config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: any = null;

  constructor(private readonly prisma: PrismaService) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (accountSid && authToken) {
      try {
        // Dynamically load twilio package if available
        const twilio = require('twilio');
        this.twilioClient = twilio(accountSid, authToken);
        this.logger.log('Twilio client initialized successfully.');
      } catch (err: any) {
        this.logger.warn(`Could not load twilio library. SMS will run in mock mode. Error: ${err.message}`);
      }
    } else {
      this.logger.log('Twilio credentials not found in env. Running SMS in mock mode.');
    }
  }

  async sendSms(to: string, message: string, type: 'RENEWAL_REMINDER' | 'DRUG_TEST_REMINDER' | 'APPOINTMENT_REMINDER' | string) {
    this.logger.log(`Dispatching SMS to=${to} type=${type}...`);
    
    let status = 'SENT';
    
    if (this.twilioClient) {
      try {
        const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+15017122661';
        await this.twilioClient.messages.create({
          body: message,
          from: fromNumber,
          to: to,
        });
        status = 'DELIVERED';
        this.logger.log(`Twilio SMS successfully dispatched to ${to}`);
      } catch (err: any) {
        this.logger.error(`Twilio SMS failure to ${to}: ${err.message}`);
        status = 'FAILED';
      }
    } else {
      // Mock simulation delay
      await new Promise(resolve => setTimeout(resolve, 300));
      this.logger.log(`[MOCK SMS] Sent to ${to}: "${message}"`);
    }

    // Save to SMSLog (Mocked for Phase A)
    return {
      id: Math.random().toString(36).substring(2, 9),
      to,
      message,
      status,
      type,
      createdAt: new Date(),
    };
  }

  async queueSms(to: string, message: string, type: string) {
    const user = await this.prisma.user.findFirst({ where: { phone: to } });
    let logId: string | undefined;

    if (user) {
      const notification = await this.prisma.notification.create({
        data: {
          userId: user.id,
          title: type || 'SMS Alert',
          message,
          body: message,
          type: 'INFO',
          channel: 'SMS',
          status: 'PENDING',
        },
      });
      logId = notification.id;
    }

    // Queue job through BullMQ
    await Queues.sms.add(
      type,
      { to, message, type, logId, userId: user?.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
    );

    return {
      id: logId || Math.random().toString(36).substring(2, 9),
      to,
      message,
      status: 'PENDING',
      type,
    };
  }

  async getSmsLogs() {
    return this.prisma.notification.findMany({
      where: { channel: 'SMS' },
      orderBy: { createdAt: 'desc' },
    });
  }
}

