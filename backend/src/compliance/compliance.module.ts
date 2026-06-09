import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { AwsTextractProvider } from './providers/aws-textract.provider';
import { LocalRegexOcrProvider } from './providers/local-regex.provider';
import { PrismaModule } from '../prisma/prisma.module';
import { ReminderModule } from '../reminder/reminder.module';

@Module({
  imports: [PrismaModule, ReminderModule],
  providers: [
    ComplianceService,
    { 
      provide: 'OCR_PROVIDER', 
      useFactory: () => {
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
          return new AwsTextractProvider();
        }
        return new LocalRegexOcrProvider();
      }
    },
  ],
  controllers: [ComplianceController],
  exports: [ComplianceService],
})
export class ComplianceModule {}
