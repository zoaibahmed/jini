import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { REMINDER_QUEUE } from '../queues/queue.constants';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Processor(REMINDER_QUEUE)
export class ReminderProcessor {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  @Process()
  async handle(job: Job<any>) {
    this.logger.log(`Processing reminder job ${job.id}`);
    
    // Stub implementation – real email reminder logic will be added later
    
    if (job.data.recipientPhone) {
      try {
        await this.whatsappService.sendWhatsAppMessage(
          job.data.recipientPhone,
          job.data.message || 'You have a new reminder from JINI Solutions.',
          undefined // no lead id by default, WhatsappService attempts to look it up
        );
      } catch (e) {
        this.logger.error(`Failed to send WhatsApp reminder: ${e.message}`);
      }
    }

    return { success: true };
  }
}
