import { Module } from '@nestjs/common';
import { CopilotGateway } from './copilot.gateway';
import { CopilotController } from './copilot.controller';
import { AiService } from './ai.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [CopilotController],
  providers: [CopilotGateway, AiService],
  exports: [AiService],
})
export class CopilotModule {}
