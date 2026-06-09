import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { EmailWorker } from '../workers/email.processor';

@Module({
  imports: [PrismaModule],
  providers: [
    EmailService,
    {
      provide: 'EMAIL_WORKER',
      useValue: EmailWorker,
    },
  ],
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule {}
