import * as fs from 'fs';
import * as path from 'path';

export interface CRMCall {
  id: string;
  leadId: string;
  agentName: string;
  note: string;
  createdAt: string;
}

export interface CRMMeeting {
  id: string;
  leadId: string;
  agenda: string;
  scheduled: string;
  createdAt: string;
}

export interface CRMSale {
  id: string;
  leadId: string;
  amount: number;
  product: string;
  createdAt: string;
}

export interface CRMLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  language: string;
  source: string;
  notes?: string;
  status: string; // NEW | CONTACTED | FOLLOW_UP | QUALIFIED | CONVERTED | LOST
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const CALLS_FILE = path.join(DATA_DIR, 'crm_calls.json');
const MEETINGS_FILE = path.join(DATA_DIR, 'crm_meetings.json');
const SALES_FILE = path.join(DATA_DIR, 'crm_sales.json');

export class CrmStore {
  private static initFile(filePath: string, defaultData: any) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
    }
  }

  static getLeads(): CRMLead[] {
    this.initFile(LEADS_FILE, []);
    try {
      return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }

  static saveLeads(leads: CRMLead[]) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  }

  static deleteLead(id: string) {
    let leads = this.getLeads();
    leads = leads.filter(l => l.id !== id);
    this.saveLeads(leads);
  }

  static getCalls(): CRMCall[] {
    this.initFile(CALLS_FILE, []);
    try {
      return JSON.parse(fs.readFileSync(CALLS_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }

  static saveCalls(calls: CRMCall[]) {
    fs.writeFileSync(CALLS_FILE, JSON.stringify(calls, null, 2), 'utf-8');
  }

  static getMeetings(): CRMMeeting[] {
    this.initFile(MEETINGS_FILE, []);
    try {
      return JSON.parse(fs.readFileSync(MEETINGS_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }

  static saveMeetings(meetings: CRMMeeting[]) {
    fs.writeFileSync(MEETINGS_FILE, JSON.stringify(meetings, null, 2), 'utf-8');
  }

  static getSales(): CRMSale[] {
    this.initFile(SALES_FILE, []);
    try {
      return JSON.parse(fs.readFileSync(SALES_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }

  static saveSales(sales: CRMSale[]) {
    fs.writeFileSync(SALES_FILE, JSON.stringify(sales, null, 2), 'utf-8');
  }
}
