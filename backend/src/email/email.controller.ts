import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('email')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('logs')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async getLogs() {
    return this.emailService.getEmailLogs();
  }

  @Post('send')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async sendManualEmail(
    @Body() body: { to: string; subject: string; body: string; type: string }
  ) {
    return this.emailService.queueEmail(body.to, body.subject, body.body, body.type);
  }
}
