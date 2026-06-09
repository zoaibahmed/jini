import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { redisConnection, Worker } from './worker.config';
import { PrismaClient } from '@prisma/client';

const logger = new Logger('EmailJobProcessor');
const prisma = new PrismaClient();

// Instantiate BullMQ Worker for emails queue
export const EmailWorker = new Worker(
  'emails',
  async (job: Job) => {
    logger.log(`Processing Job ID=${job.id} Name=${job.name}...`);
    
    const { to, subject, body, type, logId } = job.data;
    
    if (!to || !subject || !body) {
      throw new Error('Invalid email payload data. Missing to/subject/body fields.');
    }

    try {
      // Simulate SMTP network communication
      await simulateEmailSmtpDispatch(to, subject, body);

      logger.log(`Completed Email Job ID=${job.id} to=${to}`);

      let targetUserId = job.data.userId;
      if (!targetUserId) {
        const user = await prisma.user.findUnique({ where: { email: to } });
        if (user) targetUserId = user.id;
      }

      if (targetUserId) {
        if (logId) {
          await prisma.notification.update({
            where: { id: logId },
            data: { status: 'SENT', sentAt: new Date() },
          });
        } else {
          await prisma.notification.create({
            data: {
              userId: targetUserId,
              title: subject,
              message: body,
              body: body,
              type: 'INFO',
              channel: 'EMAIL',
              status: 'SENT',
              sentAt: new Date(),
            },
          });
        }
      } else {
        logger.log(`Skipping DB email logging: recipient ${to} cannot be associated with any user.`);
      }

      return { status: 'DISPATCHED', recipient: to };
    } catch (error: any) {
      logger.error(`Failed Email Job ID=${job.id} to=${to}. Error: ${error.message}`);
      
      let targetUserId = job.data.userId;
      if (!targetUserId) {
        const user = await prisma.user.findUnique({ where: { email: to } });
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
              title: subject,
              message: body,
              body: body,
              type: 'ERROR',
              channel: 'EMAIL',
              status: 'FAILED',
              failureReason: error.message,
              sentAt: new Date(),
            },
          });
        }
      } else {
        logger.log(`Skipping DB email logging: recipient ${to} cannot be associated with any user.`);
      }
      
      throw error; // Re-throw so BullMQ triggers retry logic
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 email jobs simultaneously per worker pod
  }
);

// Helper function to mock SMTP delays
async function simulateEmailSmtpDispatch(to: string, subject: string, body: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate random transient network/SMTP failure 5% of time to demonstrate BullMQ retries
      if (Math.random() < 0.05) {
        reject(new Error('Transient SMTP socket timeout. Connection failed.'));
      } else {
        resolve();
      }
    }, 600);
  });
}
