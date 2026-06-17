import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceCheckerService } from './compliance-checker.service';
import { ComplianceController } from './compliance.controller';
import { AwsTextractProvider } from './providers/aws-textract.provider';
import { LocalRegexOcrProvider } from './providers/local-regex.provider';
import { OpenAiOcrProvider } from './providers/openai-ocr.provider';
import { PrismaModule } from '../prisma/prisma.module';
import { ReminderModule } from '../reminder/reminder.module';
import { NotificationModule } from '../notification/notification.module';
import { EmailModule } from '../email/email.module';
import { SmsModule } from '../sms/sms.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    PrismaModule, 
    ReminderModule,
    NotificationModule,
    EmailModule,
    SmsModule,
    WhatsappModule
  ],
  providers: [
    ComplianceService,
    ComplianceCheckerService,
    { 
      provide: 'OCR_PROVIDER', 
      useFactory: () => {
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
          return new AwsTextractProvider();
        }
        if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('YOUR_')) {
          return new OpenAiOcrProvider(process.env.OPENAI_API_KEY);
        }
        return new LocalRegexOcrProvider();
      }
    },
  ],
  controllers: [ComplianceController],
  exports: [ComplianceService, ComplianceCheckerService],
})
export class ComplianceModule {}
