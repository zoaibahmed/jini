import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Headers } from '@nestjs/common';
import { CrmService } from './crm.service';
import { LeadStatus } from '@prisma/client';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('CRM & Leads')
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Post('leads')
  @ApiOperation({ summary: 'Create a new CRM lead card' })
  async createLead(
    @Body()
    body: {
      name: string;
      phone: string;
      email?: string;
      language?: string;
      source: string;
      notes?: string;
    },
  ) {
    return this.crmService.createLead(body);
  }

  @Get('leads')
  @ApiOperation({ summary: 'Retrieve leads list with status & search query filters' })
  async getLeads(
    @Query('search') search?: string,
    @Query('status') status?: LeadStatus,
    @Query('source') source?: string,
  ) {
    return this.crmService.getLeads({ search, status, source });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get CRM and Lead conversion rates KPIs' })
  async getCRMStats() {
    return this.crmService.getCRMStats();
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get Business Analytics including MRR, ARR, Churn, LTV' })
  async getBusinessAnalytics() {
    return this.crmService.getBusinessAnalytics();
  }

  @Get('leads/:id')
  @ApiOperation({ summary: 'Get details of a single lead including interaction timelines' })
  async getLeadDetails(@Param('id') id: string) {
    return this.crmService.getLeadDetails(id);
  }

  @Patch('leads/:id/status')
  @ApiOperation({ summary: 'Update status of a CRM lead' })
  async updateLeadStatus(
    @Param('id') id: string,
    @Body() body: { status: LeadStatus },
  ) {
    return this.crmService.updateLeadStatus(id, body.status);
  }

  @Delete('leads/:id')
  @ApiOperation({ summary: 'Delete a CRM lead' })
  async deleteLead(@Param('id') id: string) {
    return this.crmService.deleteLead(id);
  }

  @Post('leads/:id/convert')
  @ApiOperation({ summary: 'Associate CRM lead record to a registered user account' })
  async convertLead(
    @Param('id') leadId: string,
    @Body() body: { userId: string },
  ) {
    return this.crmService.linkLeadToUser(leadId, body.userId);
  }

  @Post('leads/:id/calls')
  @ApiOperation({ summary: 'Log a call event to a lead card' })
  async logCall(
    @Param('id') leadId: string,
    @Body() body: { agentName: string; note: string },
  ) {
    return this.crmService.logCall(leadId, body.agentName, body.note);
  }

  @Post('leads/:id/meetings')
  @ApiOperation({ summary: 'Log a meeting agenda schedule event to a lead' })
  async logMeeting(
    @Param('id') leadId: string,
    @Body() body: { agenda: string; scheduled: string },
  ) {
    return this.crmService.logMeeting(leadId, body.agenda, new Date(body.scheduled));
  }

  @Post('leads/:id/sales')
  @ApiOperation({ summary: 'Log a sales order conversion to a lead' })
  async logSale(
    @Param('id') leadId: string,
    @Body() body: { amount: number; product: string },
  ) {
    return this.crmService.logSale(leadId, body.amount, body.product);
  }
}
