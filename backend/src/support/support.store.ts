import * as fs from 'fs';
import * as path from 'path';

export interface SupportTicket {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  driverId: string;
  assignedAgentId?: string | null;
  createdAt: string;
  messages: Array<{
    id: string;
    senderId: string;
    message: string;
    createdAt: string;
    senderRole?: string;
  }>;
  statusHistory: Array<{
    oldStatus: string;
    newStatus: string;
    changedById: string;
    comment: string;
    createdAt: string;
  }>;
  internalNotes: Array<{
    agentId: string;
    note: string;
    createdAt: string;
  }>;
  escalations: Array<{
    escalatedById: string;
    escalatedToId?: string | null;
    reason: string;
    createdAt: string;
  }>;
}

export class SupportStore {
  private static readonly filePath = path.join(process.cwd(), 'data', 'support_tickets.json');

  private static ensureFileExists() {
    if (!fs.existsSync(this.filePath)) {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify([]));
    }
  }

  static getAll(): SupportTicket[] {
    this.ensureFileExists();
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static getById(id: string): SupportTicket | undefined {
    return this.getAll().find((t) => t.id === id);
  }

  static save(ticket: SupportTicket) {
    const tickets = this.getAll();
    const index = tickets.findIndex((t) => t.id === ticket.id);
    if (index >= 0) {
      tickets[index] = ticket;
    } else {
      tickets.push(ticket);
    }
    fs.writeFileSync(this.filePath, JSON.stringify(tickets, null, 2));
  }

  static generateId(): string {
    return 'id-' + Math.random().toString(36).substring(2, 10);
  }
}
