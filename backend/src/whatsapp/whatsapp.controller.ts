import { Controller, Get, Post, Body, Param, UseGuards, Query, Res, HttpStatus } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('threads')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async getThreads() {
    return this.whatsappService.getInboxThreads();
  }

  @Get('thread/:phone')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async getThreadMessages(@Param('phone') phone: string) {
    return this.whatsappService.getThreadMessages(phone);
  }

  @Post('send')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async sendMessage(
    @Body() body: { phone: string; message: string; leadId?: string }
  ) {
    return this.whatsappService.sendWhatsAppMessage(body.phone, body.message, body.leadId);
  }
}

@Controller('webhooks/meta-whatsapp')
export class MetaWebhookController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response
  ) {
    const verifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN;
    if (mode && token) {
      if (mode === 'subscribe' && token === verifyToken) {
        return res.status(HttpStatus.OK).send(challenge);
      } else {
        return res.sendStatus(HttpStatus.FORBIDDEN);
      }
    }
    return res.sendStatus(HttpStatus.BAD_REQUEST);
  }

  @Post()
  async handleMetaWebhook(@Body() body: any, @Res() res: Response) {
    if (body.object) {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        const from = body.entry[0].changes[0].value.messages[0].from;
        const msg_body = body.entry[0].changes[0].value.messages[0].text?.body || '[Media/Unsupported Message]';

        await this.whatsappService.receiveWhatsAppMessage(from, msg_body);
      }
      return res.sendStatus(HttpStatus.OK);
    } else {
      return res.sendStatus(HttpStatus.NOT_FOUND);
    }
  }
}
