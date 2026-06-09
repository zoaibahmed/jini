import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CallbackService } from './callback.service';
import { CallbackController } from './callback.controller';

@Module({
  imports: [PrismaModule],
  providers: [CallbackService],
  controllers: [CallbackController],
})
export class CallbackModule {}
