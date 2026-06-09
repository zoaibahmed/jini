// reminder.module.ts
import { Module } from '@nestjs/common';
import { ReminderController } from './reminder.controller';
import { ReminderService } from './reminder.service';
import { ReminderWorker } from '../workers/reminder.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { SmsModule } from '../sms/sms.module';

import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    SmsModule,
    WhatsappModule,
  ],
  controllers: [ReminderController],
  providers: [ReminderService, ReminderWorker],
  exports: [ReminderService],
})
export class ReminderModule {}

