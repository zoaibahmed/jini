import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { redisConnection, Worker } from './worker.config';
import { PrismaClient } from '@prisma/client';

const logger = new Logger('SmsJobProcessor');
const prisma = new PrismaClient();

let twilioClient: any = null;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (accountSid && authToken && !accountSid.startsWith('YOUR_')) {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(accountSid, authToken);
    logger.log('Twilio client initialized in SMS worker.');
  } catch (err: any) {
    logger.warn(`Could not load twilio in SMS worker. SMS will run in mock mode. Error: ${err.message}`);
  }
}

export const SmsWorker = new Worker(
  'sms',
  async (job: Job) => {
    logger.log(`Processing SMS Job ID=${job.id} Name=${job.name}...`);
    const { to, message, type, logId } = job.data;

    if (!to || !message) {
      throw new Error('Invalid SMS payload data. Missing to/message fields.');
    }

    let status = 'SENT';
    try {
      if (twilioClient) {
        const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+15017122661';
        await twilioClient.messages.create({
          body: message,
          from: fromNumber,
          to: to,
        });
        status = 'DELIVERED';
        logger.log(`Twilio SMS successfully dispatched to ${to}`);
      } else {
        await new Promise(resolve => setTimeout(resolve, 300));
        logger.log(`[MOCK SMS WORKER] Sent to ${to}: "${message}"`);
      }

      let targetUserId = job.data.userId;
      if (!targetUserId) {
        // Try looking up user by phone number
        const user = await prisma.user.findFirst({
          where: { phone: to },
        });
        if (user) targetUserId = user.id;
      }

      if (targetUserId) {
        if (logId) {
          await prisma.notification.update({
            where: { id: logId },
            data: { status, sentAt: new Date() },
          });
        } else {
          await prisma.notification.create({
            data: {
              userId: targetUserId,
              title: type || 'SMS Alert',
              message,
              body: message,
              type: 'INFO',
              channel: 'SMS',
              status,
              sentAt: new Date(),
            },
          });
        }
      } else {
        logger.log(`Skipping DB SMS logging: recipient ${to} cannot be associated with any user.`);
      }

      return { status: 'DISPATCHED', recipient: to };
    } catch (error: any) {
      logger.error(`Failed SMS Job ID=${job.id} to=${to}. Error: ${error.message}`);
      
      let targetUserId = job.data.userId;
      if (!targetUserId) {
        const user = await prisma.user.findFirst({
          where: { phone: to },
        });
        if (user) targetUserId = user.id;
      }

      if (targetUserId) {
        if (logId) {
          await prisma.notification.update({
            where: { id: logId },
            data: { status: 'FAILED', failureReason: error.message },
          });
        } else {
          await prisma.notification.create({
            data: {
              userId: targetUserId,
              title: type || 'SMS Alert',
              message,
              body: message,
              type: 'ERROR',
              channel: 'SMS',
              status: 'FAILED',
              failureReason: error.message,
              sentAt: new Date(),
            },
          });
        }
      } else {
        logger.log(`Skipping DB SMS logging: recipient ${to} cannot be associated with any user.`);
      }

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);
