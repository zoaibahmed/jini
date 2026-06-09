import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SmsService } from './sms.service';
import { SmsWorker } from '../workers/sms.processor';

@Module({
  imports: [PrismaModule],
  providers: [
    SmsService,
    {
      provide: 'SMS_WORKER',
      useValue: SmsWorker,
    },
  ],
  exports: [SmsService],
})
export class SmsModule {}

