import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { DriverModule } from './driver/driver.module';
import { CopilotModule } from './copilot/copilot.module';
import { AuthModule } from './auth/auth.module';
import { DocumentModule } from './document/document.module';
import { BillingModule } from './billing/billing.module';
import { SupportModule } from './support/support.module';
import { VoiceModule } from './voice/voice.module';
// import { AdminModule } from './admin/admin.module';
import { AppointmentModule } from './appointment/appointment.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { CrmModule } from './crm/crm.module';
// import { CallbackModule } from './callback/callback.module';
import { EmailModule } from './email/email.module';
import { NotificationModule } from './notification/notification.module';
import { ReminderModule } from './reminder/reminder.module';
import { SmsModule } from './sms/sms.module';
import { HealthModule } from './health/health.module';
// import { ResourcesModule } from './resources/resources.module';
import { ComplianceModule } from './compliance/compliance.module';
import { MockController } from './mock.controller';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ComplianceModule,
    DocumentModule,
    BillingModule,
    DriverModule,
    SupportModule,
    CopilotModule,
    CrmModule,
    AppointmentModule,
    WhatsappModule,
    EmailModule,
    NotificationModule,
    ReminderModule,
    SmsModule,
    HealthModule,
    VoiceModule
  ],
  controllers: [AppController, MockController],
  providers: [AppService],
})
export class AppModule {}
