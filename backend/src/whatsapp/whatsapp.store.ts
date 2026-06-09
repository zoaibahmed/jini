import * as fs from 'fs';
import * as path from 'path';

export interface WhatsAppMessageLog {
  id: string;
  phone: string;
  message: string;
  direction: 'INBOUND' | 'OUTBOUND';
  leadId?: string | null;
  syncedToCrm: boolean;
  createdAt: string;
}

export interface WhatsAppThread {
  phone: string;
  leadName?: string;
  leadId?: string | null;
  lastMessage: string;
  direction: 'INBOUND' | 'OUTBOUND';
  updatedAt: string;
  unreadCount: number;
}

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const WHATSAPP_LOGS_FILE = path.join(DATA_DIR, 'whatsapp_logs.json');
const WHATSAPP_THREADS_FILE = path.join(DATA_DIR, 'whatsapp_threads.json');

export class WhatsappStore {
  private static initFile(filePath: string) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  static getLogs(): WhatsAppMessageLog[] {
    this.initFile(WHATSAPP_LOGS_FILE);
    try {
      return JSON.parse(fs.readFileSync(WHATSAPP_LOGS_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }

  static saveLogs(logs: WhatsAppMessageLog[]) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(WHATSAPP_LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  }

  static getThreads(): WhatsAppThread[] {
    this.initFile(WHATSAPP_THREADS_FILE);
    try {
      return JSON.parse(fs.readFileSync(WHATSAPP_THREADS_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }

  static saveThreads(threads: WhatsAppThread[]) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(WHATSAPP_THREADS_FILE, JSON.stringify(threads, null, 2), 'utf-8');
  }
}

