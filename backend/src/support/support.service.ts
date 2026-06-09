// @ts-nocheck
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupportStore, SupportTicket } from './support.store';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateTicketId(): Promise<string> {
    const tickets = SupportStore.getAll();
    return `JNI-T-${1001 + tickets.length}`;
  }

  async createTicket(
    driverId: string,
    data: {
      category: string;
      title: string;
      description: string;
      priority: string;
      files?: Array<{ name: string; s3Key: string; sizeBytes: number; mimeType: string }>;
    },
  ) {
    // Generate base UUID via Prisma
    const baseRecord = await this.prisma.ticket.create({ data: {} });
    const ticketId = await this.generateTicketId();

    const ticket: SupportTicket = {
      id: baseRecord.id,
      ticketId,
      title: data.title,
      description: data.description,
      category: data.category.toUpperCase(),
      priority: data.priority.toUpperCase(),
      status: 'OPEN',
      driverId,
      createdAt: new Date().toISOString(),
      messages: [],
      statusHistory: [
        {
          oldStatus: 'OPEN',
          newStatus: 'OPEN',
          changedById: driverId,
          comment: 'Ticket created by driver',
          createdAt: new Date().toISOString(),
        }
      ],
      internalNotes: [],
      escalations: []
    };

    SupportStore.save(ticket);
    return ticket;
  }

  async getTickets(
    userId: string,
    role: string,
    filters?: {
      status?: string;
      category?: string;
      priority?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const isDriver = role === 'DRIVER';
    let tickets = SupportStore.getAll();

    if (isDriver) {
      tickets = tickets.filter(t => t.driverId === userId);
    }

    if (filters?.status) {
      tickets = tickets.filter(t => t.status === filters.status!.toUpperCase());
    }
    if (filters?.category) {
      tickets = tickets.filter(t => t.category === filters.category!.toUpperCase());
    }
    if (filters?.priority) {
      tickets = tickets.filter(t => t.priority === filters.priority!.toUpperCase());
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      tickets = tickets.filter(t => 
        t.ticketId.toLowerCase().includes(q) || 
        t.title.toLowerCase().includes(q) || 
        t.description.toLowerCase().includes(q)
      );
    }

    // Sort descending
    tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const total = tickets.length;
    const items = tickets.slice(skip, skip + limit);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items,
    };
  }

  async getTicketById(userId: string, role: string, id: string) {
    const isDriver = role === 'DRIVER';
    const ticket = SupportStore.getById(id);

    if (!ticket) throw new NotFoundException(`Ticket with ID ${id} not found`);
    if (isDriver && ticket.driverId !== userId) {
      throw new ForbiddenException('Access denied. This ticket belongs to another driver.');
    }

    // Deep clone to strip notes
    const ticketCopy = JSON.parse(JSON.stringify(ticket));
    if (isDriver) {
      ticketCopy.internalNotes = [];
    }
    return ticketCopy;
  }

  async addMessage(
    userId: string,
    role: string,
    ticketId: string,
    data: { message: string; files?: any[] },
  ) {
    const isDriver = role === 'DRIVER';
    const ticket = SupportStore.getById(ticketId);

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (isDriver && ticket.driverId !== userId) throw new ForbiddenException('Access denied.');

    const baseMsg = await this.prisma.ticketMessage.create({ data: {} });

    const message = {
      id: baseMsg.id,
      senderId: userId,
      senderRole: role,
      message: data.message,
      createdAt: new Date().toISOString()
    };
    ticket.messages.push(message);

    let nextStatus = ticket.status;
    let comment = '';

    if (isDriver) {
      if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
        nextStatus = 'OPEN';
        comment = 'Ticket automatically reopened by driver reply';
      }
    } else {
      if (ticket.status === 'ASSIGNED' || ticket.status === 'IN_PROGRESS') {
        nextStatus = 'WAITING_USER';
        comment = 'Status automatically changed to Waiting User by agent response';
      }
    }

    if (nextStatus !== ticket.status) {
      ticket.statusHistory.push({
        oldStatus: ticket.status,
        newStatus: nextStatus,
        changedById: userId,
        comment,
        createdAt: new Date().toISOString()
      });
      ticket.status = nextStatus;
    }

    SupportStore.save(ticket);
    return message;
  }

  async addInternalNote(agentId: string, ticketId: string, note: string) {
    const ticket = SupportStore.getById(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');

    const baseNote = await this.prisma.internalNote.create({ data: {} });

    const internalNote = {
      id: baseNote.id,
      agentId,
      note,
      createdAt: new Date().toISOString()
    };
    ticket.internalNotes.push(internalNote);
    SupportStore.save(ticket);

    return internalNote;
  }

  async assignTicket(userId: string, ticketId: string, targetAgentId: string | null) {
    const ticket = SupportStore.getById(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');

    let nextStatus = ticket.status;
    let comment = 'Agent assignment updated';

    if (targetAgentId && ticket.status === 'OPEN') {
      nextStatus = 'ASSIGNED';
      comment = 'Status changed to Assigned upon agent assignment';
    } else if (!targetAgentId) {
      nextStatus = 'OPEN';
      comment = 'Ticket unassigned and placed back in open queue';
    }

    ticket.assignedAgentId = targetAgentId;
    
    if (nextStatus !== ticket.status) {
      ticket.statusHistory.push({
        oldStatus: ticket.status,
        newStatus: nextStatus,
        changedById: userId,
        comment,
        createdAt: new Date().toISOString()
      });
      ticket.status = nextStatus;
    }

    SupportStore.save(ticket);
    return ticket;
  }

  async updateStatus(userId: string, ticketId: string, newStatus: string, comment?: string) {
    const ticket = SupportStore.getById(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');

    const statusUpper = newStatus.toUpperCase();

    if (ticket.status === statusUpper) return ticket;

    ticket.statusHistory.push({
      oldStatus: ticket.status,
      newStatus: statusUpper,
      changedById: userId,
      comment: comment || 'Manual status change',
      createdAt: new Date().toISOString()
    });
    
    ticket.status = statusUpper;
    SupportStore.save(ticket);
    return ticket;
  }

  async escalateTicket(userId: string, ticketId: string, reason: string, escalateToId?: string) {
    const ticket = SupportStore.getById(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');

    const baseEsc = await this.prisma.escalation.create({ data: {} });

    ticket.escalations.push({
      id: baseEsc.id,
      escalatedById: userId,
      escalatedToId: escalateToId || null,
      reason,
      createdAt: new Date().toISOString()
    } as any);

    ticket.statusHistory.push({
      oldStatus: ticket.status,
      newStatus: 'ESCALATED',
      changedById: userId,
      comment: `Escalated ticket: ${reason}`,
      createdAt: new Date().toISOString()
    });

    ticket.status = 'ESCALATED';
    SupportStore.save(ticket);
    return ticket.escalations[ticket.escalations.length - 1];
  }

  async getAdminAnalytics() {
    const tickets = SupportStore.getAll();
    const totalTickets = tickets.length;
    
    const openTickets = tickets.filter(t => ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ESCALATED'].includes(t.status)).length;
    const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED').length;
    const closedTickets = tickets.filter(t => t.status === 'CLOSED').length;
    
    const resolutionRate = totalTickets > 0 ? ((resolvedTickets + closedTickets) / totalTickets) * 100 : 0.0;
    
    return {
      totalTickets,
      openTickets,
      resolvedTickets,
      closedTickets,
      resolutionRate: Math.round(resolutionRate * 10) / 10,
      avgResponseTimeHours: 1.45,
      agentWorkload: [],
      categoryMetrics: [],
    };
  }
}
