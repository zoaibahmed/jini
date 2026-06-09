import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappStore, WhatsAppMessageLog, WhatsAppThread } from './whatsapp.store';
import { CrmStore } from '../crm/crm.store';
import { randomUUID } from 'crypto';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly metaAccessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;
  private readonly metaPhoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

  constructor(private readonly prisma: PrismaService) {
    if (this.metaAccessToken && this.metaPhoneNumberId && !this.metaAccessToken.includes('YOUR_')) {
      this.logger.log('Meta WhatsApp client configured.');
    } else {
      this.logger.warn('Meta credentials missing or invalid. WhatsApp is in simulated mode.');
    }
  }

  private updateThread(log: WhatsAppMessageLog, leadName: string = 'Unknown Driver') {
    const threads = WhatsappStore.getThreads();
    const existingThreadIdx = threads.findIndex(t => t.phone === log.phone);
    
    if (existingThreadIdx >= 0) {
      threads[existingThreadIdx].lastMessage = log.message;
      threads[existingThreadIdx].direction = log.direction;
      threads[existingThreadIdx].updatedAt = log.createdAt;
      if (log.leadId) {
        threads[existingThreadIdx].leadId = log.leadId;
        threads[existingThreadIdx].leadName = leadName;
      }
      if (log.direction === 'INBOUND') {
        threads[existingThreadIdx].unreadCount += 1;
      } else {
        threads[existingThreadIdx].unreadCount = 0;
      }
    } else {
      threads.push({
        phone: log.phone,
        leadName,
        leadId: log.leadId,
        lastMessage: log.message,
        direction: log.direction,
        updatedAt: log.createdAt,
        unreadCount: log.direction === 'INBOUND' ? 1 : 0
      });
    }
    WhatsappStore.saveThreads(threads);
  }

  async sendWhatsAppMessage(phone: string, message: string, leadId?: string) {
    this.logger.log(`Sending WhatsApp message to=${phone}`);

    // Remove any non-numeric chars from phone for Meta
    const cleanPhone = phone.replace(/\D/g, '');

    let finalLeadId = leadId;
    let leadName = 'Unknown Driver';
    
    const leads = CrmStore.getLeads();
    if (!finalLeadId) {
      const lead = leads.find(l => l.phone.replace(/\D/g, '').includes(cleanPhone));
      if (lead) {
        finalLeadId = lead.id;
        leadName = lead.name;
      }
    } else {
      const lead = leads.find(l => l.id === finalLeadId);
      if (lead) leadName = lead.name;
    }

    // Attempt Meta Delivery
    if (this.metaAccessToken && this.metaPhoneNumberId) {
      try {
        const response = await fetch(`https://graph.facebook.com/v19.0/${this.metaPhoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.metaAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'text',
            text: {
              body: message
            }
          })
        });

        const result = await response.json();
        if (response.ok) {
          this.logger.log('Meta WhatsApp message sent successfully.');
        } else {
          this.logger.error(`Meta WhatsApp send failed: ${JSON.stringify(result)}`);
        }
      } catch (e) {
        this.logger.error(`Meta WhatsApp request failed: ${e.message}`);
      }
    } else {
      this.logger.log(`[SIMULATED DELIVERY] to=${cleanPhone}: ${message}`);
    }

    const logs = WhatsappStore.getLogs();
    const newLog: WhatsAppMessageLog = {
      id: randomUUID(),
      phone: cleanPhone,
      message,
      direction: 'OUTBOUND',
      leadId: finalLeadId || null,
      syncedToCrm: !!finalLeadId,
      createdAt: new Date().toISOString()
    };
    
    logs.push(newLog);
    WhatsappStore.saveLogs(logs);
    this.updateThread(newLog, leadName);

    // If linked to a lead, append a note to CRM
    if (finalLeadId) {
      const idx = leads.findIndex(l => l.id === finalLeadId);
      if (idx !== -1) {
        leads[idx].notes = `[WhatsApp Outbound - ${new Date().toLocaleDateString()}]: ${message}\n` + (leads[idx].notes || '');
        leads[idx].updatedAt = new Date().toISOString();
        CrmStore.saveLeads(leads);
      }
    }

    return newLog;
  }

  async receiveWhatsAppMessage(phone: string, message: string) {
    this.logger.log(`Received WhatsApp message from=${phone}: "${message}"`);
    const cleanPhone = phone.replace('whatsapp:', '');

    const digitsOnly = cleanPhone.replace(/\D/g, '');
    const leads = CrmStore.getLeads();
    const lead = leads.find(l => {
      const lPhone = l.phone.replace(/\D/g, '');
      return lPhone.includes(digitsOnly.substring(digitsOnly.length - 10));
    });

    const logs = WhatsappStore.getLogs();
    const newLog: WhatsAppMessageLog = {
      id: randomUUID(),
      phone: cleanPhone,
      message,
      direction: 'INBOUND',
      leadId: lead ? lead.id : null,
      syncedToCrm: !!lead,
      createdAt: new Date().toISOString()
    };
    
    logs.push(newLog);
    WhatsappStore.saveLogs(logs);
    this.updateThread(newLog, lead ? lead.name : 'Unknown Driver');

    if (lead) {
      const idx = leads.findIndex(l => l.id === lead.id);
      if (idx !== -1) {
        leads[idx].notes = `[WhatsApp Inbound - ${new Date().toLocaleDateString()}]: ${message}\n` + (leads[idx].notes || '');
        leads[idx].updatedAt = new Date().toISOString();
        CrmStore.saveLeads(leads);
      }
    }

    return newLog;
  }

  async getLogs() {
    return WhatsappStore.getLogs().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getInboxThreads() {
    return WhatsappStore.getThreads().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getThreadMessages(phone: string) {
    const cleanPhone = phone.replace('whatsapp:', '');
    const logs = WhatsappStore.getLogs();
    
    // Clear unread count when thread is fetched
    const threads = WhatsappStore.getThreads();
    const threadIdx = threads.findIndex(t => t.phone === cleanPhone);
    if (threadIdx >= 0 && threads[threadIdx].unreadCount > 0) {
      threads[threadIdx].unreadCount = 0;
      WhatsappStore.saveThreads(threads);
    }

    return logs
      .filter(l => l.phone === cleanPhone)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
}
