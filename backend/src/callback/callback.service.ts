import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeadStatus, TicketCategory, TicketStatus, TicketPriority } from '@prisma/client';

@Injectable()
export class CallbackService {
  constructor(private readonly prisma: PrismaService) {}

  async requestCallback(data: {
    name: string;
    phone: string;
    email?: string;
    language?: string;
    notes?: string;
    driverId?: string; // Optional if logged in
  }) {
    // 1. Create a CRM Lead card
    const lead = await this.prisma.lead.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        language: data.language || 'English',
        source: 'CALLBACK',
        notes: data.notes || 'Callback requested via portal form',
        status: LeadStatus.NEW,
        userId: data.driverId || undefined,
      },
    });

    // Resolve a driver ID to link the support ticket to (since driverId is required)
    let finalDriverId = data.driverId;
    if (!finalDriverId) {
      // Find driver by email or phone
      const matched = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: data.email || 'undefined_email' },
            { phone: data.phone },
            { role: 'DRIVER' },
          ],
        },
      });
      finalDriverId = matched?.id;
    }

    // Fallback if no user exists at all
    if (!finalDriverId) {
      const firstUser = await this.prisma.user.findFirst();
      finalDriverId = firstUser?.id;
    }

    // 2. Create support ticket if driver ID is available
    let ticket: any = null;
    if (finalDriverId) {
      const ticketCount = await this.prisma.ticket.count();
      const ticketId = `JNI-T-${1001 + ticketCount}`;

      ticket = await this.prisma.ticket.create({
        data: {
          ticketId,
          title: `Callback Request: ${data.name}`,
          description: `Driver requested an outbound telephone call back.\nPhone: ${data.phone}\nPreferred Language: ${data.language || 'English'}\nNotes: ${data.notes || 'No description provided.'}`,
          category: TicketCategory.GENERAL,
          status: TicketStatus.OPEN,
          priority: TicketPriority.URGENT,
          driverId: finalDriverId,
        },
      });
    }

    // 3. Create Admin notifications
    const admins = await this.prisma.user.findMany({
      where: {
        OR: [{ role: 'ADMIN' }, { role: 'SUPERADMIN' }],
      },
    });

    for (const admin of admins) {
      await this.prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'New Callback Request',
          message: `Inbound request from ${data.name} (${data.phone})`,
          body: `Inbound request from ${data.name} (${data.phone})`,
          type: 'WARNING',
          read: false,
        },
      });
    }

    // 4. Log in Voice Callback outbound dialer queue
    const voiceCallback = await this.prisma.voiceCallback.create({
      data: {
        callId: `VC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        caller: data.phone,
        status: 'PENDING',
      },
    });

    return { lead, ticket, voiceCallback };
  }
}
