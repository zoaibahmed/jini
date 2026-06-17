import { Controller, Get, Post, Patch, Param, Body, Query, Headers, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupportService } from './support.service';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';

@ApiTags('Support Ticketing & Case Management')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // Helper context extractor from simulation headers
  private getAuthContext(userIdHeader?: string, roleHeader?: string) {
    if (!userIdHeader) {
      throw new BadRequestException('User identification header (x-user-id) required');
    }
    const role = roleHeader ? roleHeader.toUpperCase() : 'DRIVER';
    return { userId: userIdHeader, role };
  }

  @Post('upload')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: false })
  @ApiOperation({ summary: 'Upload a support document or image' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @UploadedFile() file: any,
  ) {
    this.getAuthContext(userIdHeader, roleHeader); // validate headers

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Since we're using Multer with `dest: './uploads/support'`, 
    // the file is already saved. We return the metadata.
    return {
      name: file.originalname,
      s3Key: `uploads/support/${file.filename}`, // Simulated s3Key
      sizeBytes: file.size,
      mimeType: file.mimetype,
    };
  }

  @Post('tickets')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: false })
  @ApiOperation({ summary: 'Create a new support ticket request (Drivers)' })
  async createTicket(
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @Body() body: {
      category: string;
      title: string;
      description: string;
      priority: string;
      files?: Array<{ name: string; s3Key: string; sizeBytes: number; mimeType: string }>;
    },
  ) {
    const { userId } = this.getAuthContext(userIdHeader, roleHeader);
    return this.supportService.createTicket(userId, body);
  }

  @Get('tickets')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: false })
  @ApiOperation({ summary: 'Fetch filterable ticket listings' })
  async getTickets(
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const { userId, role } = this.getAuthContext(userIdHeader, roleHeader);
    return this.supportService.getTickets(userId, role, {
      status,
      category,
      priority,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('tickets/:id')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: false })
  @ApiOperation({ summary: 'Fetch detailed single ticket logs, timeline, messages, and notes' })
  async getTicket(
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @Param('id') id: string,
  ) {
    const { userId, role } = this.getAuthContext(userIdHeader, roleHeader);
    return this.supportService.getTicketById(userId, role, id);
  }

  @Post('tickets/:id/messages')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: false })
  @ApiOperation({ summary: 'Submit reply message in a ticket thread' })
  async addMessage(
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @Param('id') ticketId: string,
    @Body() body: {
      message: string;
      files?: Array<{ name: string; s3Key: string; sizeBytes: number; mimeType: string }>;
    },
  ) {
    const { userId, role } = this.getAuthContext(userIdHeader, roleHeader);
    return this.supportService.addMessage(userId, role, ticketId, body);
  }

  @Post('tickets/:id/notes')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: false })
  @ApiOperation({ summary: 'Append a private internal note for support staff only' })
  async addInternalNote(
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @Param('id') ticketId: string,
    @Body() body: { note: string },
  ) {
    const { userId, role } = this.getAuthContext(userIdHeader, roleHeader);
    if (role !== 'SUPPORT' && role !== 'ADMIN' && role !== 'SUPERADMIN') {
      throw new BadRequestException('Access denied. Agent privileges required.');
    }
    return this.supportService.addInternalNote(userId, ticketId, body.note);
  }

  @Patch('tickets/:id/assign')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: false })
  @ApiOperation({ summary: 'Assign agent or transfer ticket ownership (Support/Admin only)' })
  async assignTicket(
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @Param('id') ticketId: string,
    @Body() body: { agentId: string | null },
  ) {
    const { userId, role } = this.getAuthContext(userIdHeader, roleHeader);
    if (role !== 'SUPPORT' && role !== 'ADMIN' && role !== 'SUPERADMIN') {
      throw new BadRequestException('Access denied. Agent privileges required.');
    }
    return this.supportService.assignTicket(userId, ticketId, body.agentId);
  }

  @Patch('tickets/:id/status')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: false })
  @ApiOperation({ summary: 'Manually override ticket status status' })
  async updateStatus(
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @Param('id') ticketId: string,
    @Body() body: { status: string; comment?: string },
  ) {
    const { userId } = this.getAuthContext(userIdHeader, roleHeader);
    return this.supportService.updateStatus(userId, ticketId, body.status, body.comment);
  }

  @Patch('tickets/:id/mode')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: false })
  @ApiOperation({ summary: 'Toggle ticket handling mode between AI_MANAGED and HUMAN_MANAGED' })
  async toggleMode(
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @Param('id') ticketId: string,
    @Body() body: { handlingMode: string },
  ) {
    const { userId, role } = this.getAuthContext(userIdHeader, roleHeader);
    if (role !== 'SUPPORT' && role !== 'ADMIN' && role !== 'SUPERADMIN') {
      throw new BadRequestException('Access denied. Agent privileges required.');
    }
    return this.supportService.toggleMode(userId, role, ticketId, body.handlingMode);
  }

  @Post('tickets/:id/escalate')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: false })
  @ApiOperation({ summary: 'Escalate ticket issues (Support/Admin only)' })
  async escalateTicket(
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @Param('id') ticketId: string,
    @Body() body: { reason: string; escalateToId?: string },
  ) {
    const { userId, role } = this.getAuthContext(userIdHeader, roleHeader);
    if (role !== 'SUPPORT' && role !== 'ADMIN' && role !== 'SUPERADMIN') {
      throw new BadRequestException('Access denied. Agent privileges required.');
    }
    return this.supportService.escalateTicket(userId, ticketId, body.reason, body.escalateToId);
  }

  @Get('admin/analytics')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiOperation({ summary: 'Fetch resolution rates and response delay analytics (Admin only)' })
  async getAdminAnalytics(
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
  ) {
    const { role } = this.getAuthContext(userIdHeader, roleHeader);
    if (role !== 'ADMIN' && role !== 'SUPERADMIN' && role !== 'SUPPORT') {
      throw new BadRequestException('Access denied. Administrative privileges required.');
    }
    return this.supportService.getAdminAnalytics();
  }
}
