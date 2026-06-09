import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Header,
  UseGuards,
  Req,
  Query,
  Param,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { VoiceService } from './voice.service';

@Controller('voice')
export class VoiceController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly voiceService: VoiceService,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  // TWILIO WEBHOOKS (public — Twilio signs requests)
  // ══════════════════════════════════════════════════════════════════════════

  /** POST /voice/incoming — Twilio calls this when a new call arrives */
  @Post('incoming')
  @Header('Content-Type', 'text/xml')
  async incomingCall(@Body() body: Record<string, any>) {
    const sid = body.CallSid || `MOCK-SID-${Date.now()}`;
    const caller = body.From || '+10000000000';
    return this.voiceService.handleIncomingCall(sid, caller);
  }

  /** POST /voice/respond — Twilio posts gathered speech here */
  @Post('respond')
  @Header('Content-Type', 'text/xml')
  async respondCall(@Body() body: Record<string, any>) {
    const sid = body.CallSid || '';
    const speech = body.SpeechResult || '';
    return this.voiceService.handleCallResponse(sid, speech);
  }

  /** POST /voice/status — Twilio call status callbacks */
  @Post('status')
  async callStatus(@Body() body: Record<string, any>) {
    const { CallSid, CallStatus, CallDuration } = body;
    if (!CallSid) return { ok: true };

    const statusMap: Record<string, string> = {
      completed: 'COMPLETED',
      failed: 'FAILED',
      busy: 'FAILED',
      'no-answer': 'FAILED',
      canceled: 'FAILED',
    };
    const status = statusMap[CallStatus] || 'ACTIVE';

    await this.prisma.voiceCall.updateMany({
      where: { sid: CallSid },
      data: {
        status,
        durationSec: CallDuration ? parseInt(CallDuration, 10) : undefined,
      },
    });
    return { ok: true };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SANDBOX / TESTING
  // ══════════════════════════════════════════════════════════════════════════

  /** POST /voice/test-call — local sandbox to test call flow without Twilio */
  @Post('test-call')
  async testCallFlow(
    @Body()
    body: {
      sid: string;
      caller: string;
      speechResult?: string;
      action?: 'start' | 'respond' | 'end';
    },
  ) {
    const action = body.action || 'respond';
    if (action === 'start') {
      const xml = await this.voiceService.handleIncomingCall(body.sid, body.caller);
      return { success: true, xml, status: 'ACTIVE' };
    } else if (action === 'end') {
      const call = await this.prisma.voiceCall.update({
        where: { sid: body.sid },
        data: { status: 'COMPLETED', durationSec: Math.floor(60 + Math.random() * 120) },
      });
      return { success: true, call };
    } else {
      const xml = await this.voiceService.handleCallResponse(body.sid, body.speechResult || 'hello');
      const call = await this.prisma.voiceCall.findUnique({
        where: { sid: body.sid },
        include: { transcripts: true },
      });
      return { success: true, xml, call };
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // OUTBOUND CALLS
  // ══════════════════════════════════════════════════════════════════════════

  /** POST /voice/outbound — admin initiates an outbound call */
  @Post('outbound')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async outboundCall(@Body() body: { toNumber: string; message: string }) {
    return this.voiceService.initiateOutboundCall(body.toNumber, body.message);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CALLBACK
  // ══════════════════════════════════════════════════════════════════════════

  /** POST /voice/callback — driver requests a callback during/after a call */
  @Post('callback')
  @Header('Content-Type', 'text/xml')
  async requestCallback(@Body() body: Record<string, any>) {
    const caller = body.From || body.caller || 'unknown';
    const callId = body.callId || '';
    if (callId) await this.voiceService.requestCallback(callId, caller);
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna-Neural">Your callback request has been registered. A JNI agent will contact you shortly. Thank you.</Say><Hangup/></Response>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AGENT OPERATIONS
  // ══════════════════════════════════════════════════════════════════════════

  /** POST /voice/transfer/:sid — agent manually transfers a call */
  @Post('transfer/:sid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SUPPORT)
  async transferCall(@Param('sid') sid: string, @Body() body: { note?: string }) {
    return this.voiceService.transferToAgent(sid, body.note);
  }

  /** PATCH /voice/calls/:id — update call outcome or intent */
  @Patch('calls/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SUPPORT)
  async updateCall(
    @Param('id') id: string,
    @Body() body: { outcome?: string; intent?: string; status?: string },
  ) {
    return this.prisma.voiceCall.update({ where: { id }, data: body });
  }

  /** POST /voice/calls/:id/note — agent adds a note to a call transcript */
  @Post('calls/:id/note')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SUPPORT)
  async addCallNote(@Param('id') id: string, @Body() body: { note: string }) {
    return this.prisma.voiceTranscript.create({
      data: { callId: id, speaker: 'AGENT', text: `[AGENT NOTE] ${body.note}` },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CALL LOGS
  // ══════════════════════════════════════════════════════════════════════════

  /** GET /voice/calls — paginated, filterable call logs */
  @Get('calls')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SUPPORT)
  async getCallLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('language') language?: string,
    @Query('intent') intent?: string,
  ) {
    return this.voiceService.getCallLogs(page, limit, search, language, intent);
  }

  /** GET /voice/calls/:id/transcript — full transcript for one call */
  @Get('calls/:id/transcript')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SUPPORT)
  async getCallTranscript(@Param('id') id: string) {
    const call = await this.prisma.voiceCall.findUnique({
      where: { id },
      include: {
        transcripts: { orderBy: { timestamp: 'asc' } },
        ticket: { select: { ticketId: true, title: true, status: true } },
      },
    });
    return call;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LIVE QUEUE
  // ══════════════════════════════════════════════════════════════════════════

  /** GET /voice/queue — live active call queue for agent dashboard */
  @Get('queue')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SUPPORT)
  async getLiveQueue() {
    return this.voiceService.getLiveQueue();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ANALYTICS
  // ══════════════════════════════════════════════════════════════════════════

  /** GET /voice/analytics — full analytics for admin dashboard */
  @Get('analytics')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SUPPORT)
  async getAnalytics() {
    return this.voiceService.getFullAnalytics();
  }
}
