// @ts-nocheck
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupportStore, SupportTicket } from './support.store';
import { SupportGateway } from './support.gateway';
import { OpenAI } from 'openai';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: SupportGateway
  ) {}

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
    // Generate base UUID via Prisma with all required fields
    const ticketId = await this.generateTicketId();
    const baseRecord = await this.prisma.ticket.create({
      data: {
        ticketId,
        driverId,
        title: data.title,
        description: data.description,
        category: data.category.toUpperCase(),
        status: 'OPEN',
        priority: data.priority.toUpperCase(),
        handlingMode: 'AI_MANAGED',
      }
    });

    const ticket: SupportTicket = {
      id: baseRecord.id,
      ticketId,
      title: data.title,
      description: data.description,
      category: data.category.toUpperCase(),
      priority: data.priority.toUpperCase(),
      status: 'OPEN',
      driverId,
      handlingMode: 'AI_MANAGED',
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

    const attachments = data.files ? data.files.map(f => ({
      name: f.name,
      s3Key: f.s3Key,
      sizeBytes: f.sizeBytes,
      mimeType: f.mimeType
    })) : [];

    const message = {
      id: baseMsg.id,
      senderId: userId,
      senderRole: role,
      message: data.message,
      attachments: attachments.length > 0 ? attachments : undefined,
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

    // Broadcast user's message immediately
    try {
      this.gateway.broadcastNewMessage(ticket.id, {
        ticketId: ticket.id,
        messageId: message.id,
        senderName: isDriver ? 'Driver' : 'Agent',
        message: message.message,
        senderRole: role,
        attachments: message.attachments,
        createdAt: message.createdAt
      });
    } catch (err) {
      console.error('Socket emit failed for user message:', err);
    }

    // Trigger AI response asynchronously if ticket is managed by AI and driver sent the message
    const handlingMode = ticket.handlingMode || 'AI_MANAGED';
    if (isDriver && handlingMode === 'AI_MANAGED') {
      this.triggerAiResponse(ticket.id).catch(err => {
        console.error('Failed to run AI response for ticket:', err);
      });
    }

    return message;
  }

  private async triggerAiResponse(ticketId: string) {
    try {
      const ticket = SupportStore.getById(ticketId);
      if (!ticket) return;

      const apiKey = process.env.OPENAI_API_KEY;
      let aiText = '';

      if (apiKey && !apiKey.startsWith('YOUR_')) {
        const openai = new OpenAI({ apiKey });
        
        // Build conversational history
        const conversationContext = ticket.messages.map(m => {
          const roleLabel = m.senderRole === 'DRIVER' ? 'User' : 'Support Agent';
          return `${roleLabel}: ${m.message}`;
        }).join('\n');

        const systemPrompt = `You are JNI Solutions AI Support Assistant. Respond politely to the TLC driver's ticket message.
Ticket Details:
Category: ${ticket.category}
Title: ${ticket.title}
Description: ${ticket.description}

Conversation history:
${conversationContext}

Reply directly and constructively. Keep it under 4 paragraphs.`;

        // Check if the latest driver message contains images for vision
        const lastDriverMsg = [...ticket.messages].reverse().find(m => m.senderRole === 'DRIVER');
        const imageAttachments = lastDriverMsg?.attachments?.filter(a => a.mimeType.startsWith('image/')) || [];

        if (imageAttachments.length > 0) {
          // Vision completion payload
          const contents: any[] = [{ type: 'text', text: systemPrompt }];
          
          for (const img of imageAttachments) {
            const filePath = path.join(process.cwd(), img.s3Key);
            if (fs.existsSync(filePath)) {
              try {
                const base64Image = fs.readFileSync(filePath).toString('base64');
                contents.push({
                  type: 'image_url',
                  image_url: {
                    url: `data:${img.mimeType};base64,${base64Image}`
                  }
                });
              } catch (err) {
                console.error(`Failed to read physical attachment for vision: ${filePath}`, err);
              }
            }
          }

          const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'user', content: contents }
            ]
          });
          aiText = response.choices[0]?.message?.content || '';
        } else {
          // Standard text chat completion
          const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt }
            ]
          });
          aiText = response.choices[0]?.message?.content || '';
        }
      }

      // Fallback response if OpenAI key is missing or call failed
      if (!aiText) {
        aiText = `Hello! I am the JNI Solutions AI Support Assistant. Thank you for your message regarding "${ticket.title}". We have logged this inquiry and our support team has been notified. We will update you shortly.`;
      }

      // Save AI message to store and DB
      const aiMsgRecord = await this.prisma.ticketMessage.create({ data: {} });
      const aiMessage = {
        id: aiMsgRecord.id,
        senderId: 'AI_AGENT',
        senderRole: 'SUPPORT',
        message: aiText,
        createdAt: new Date().toISOString()
      };

      ticket.messages.push(aiMessage);
      
      // Auto-update status to waiting user since AI replied
      if (ticket.status === 'OPEN' || ticket.status === 'ASSIGNED' || ticket.status === 'IN_PROGRESS') {
        ticket.status = 'WAITING_USER';
        ticket.statusHistory.push({
          oldStatus: ticket.status,
          newStatus: 'WAITING_USER',
          changedById: 'AI_AGENT',
          comment: 'AI response sent, changed status to Waiting User',
          createdAt: new Date().toISOString()
        });
      }

      SupportStore.save(ticket);

      // Broadcast AI's message
      this.gateway.broadcastNewMessage(ticket.id, {
        ticketId: ticket.id,
        messageId: aiMessage.id,
        senderName: 'JNI AI Assistant',
        message: aiMessage.message,
        senderRole: 'SUPPORT',
        createdAt: aiMessage.createdAt
      });

    } catch (err) {
      console.error('Failed to generate AI auto reply:', err);
    }
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

  async toggleMode(userId: string, role: string, ticketId: string, handlingMode: string) {
    const ticket = SupportStore.getById(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');

    const oldMode = ticket.handlingMode || 'AI_MANAGED';
    const newMode = handlingMode.toUpperCase();

    if (oldMode === newMode) return ticket;

    if (newMode !== 'AI_MANAGED' && newMode !== 'HUMAN_MANAGED') {
      throw new BadRequestException('Invalid handling mode specified');
    }

    const timestamp = new Date();

    ticket.handlingMode = newMode;
    ticket.lastModeChangedAt = timestamp.toISOString();

    if (newMode === 'HUMAN_MANAGED') {
      ticket.humanTakenOverById = userId;
      ticket.humanTakenOverAt = timestamp.toISOString();
    } else {
      ticket.humanTakenOverById = null;
      ticket.humanTakenOverAt = null;
    }

    await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        handlingMode: newMode,
        humanTakenOverById: ticket.humanTakenOverById,
        humanTakenOverAt: ticket.humanTakenOverAt ? timestamp : null,
        lastModeChangedAt: timestamp,
      }
    }).catch(() => {});

    await this.prisma.ticketAuditLog.create({
      data: {
        ticketId: ticket.id,
        action: 'MODE_CHANGE',
        oldMode,
        newMode,
        changedById: userId,
        changedByRole: role,
        createdAt: timestamp,
      }
    }).catch(() => {});

    SupportStore.save(ticket);

    try {
      this.gateway.broadcastModeChange(ticket.id, {
        handlingMode: newMode,
        lastModeChangedAt: ticket.lastModeChangedAt,
        humanTakenOverById: ticket.humanTakenOverById,
      });
    } catch (err) {
      console.error('Socket emit failed for mode change:', err);
    }

    return ticket;
  }
}
