import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController, MetaWebhookController } from './whatsapp.controller';

@Module({
  imports: [PrismaModule],
  providers: [WhatsappService],
  controllers: [WhatsappController, MetaWebhookController],
  exports: [WhatsappService],
})
export class WhatsappModule {}
