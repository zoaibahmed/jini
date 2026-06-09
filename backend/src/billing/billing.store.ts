import * as fs from 'fs';
import * as path from 'path';

export interface BillingPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  active: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: string; // ACTIVE | TRIAL | EXPIRED | CANCELLED | PAST_DUE
  billingPeriod: 'monthly' | 'yearly';
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  userId: string;
  amount: number;
  status: string; // PAID | UNPAID | VOID
  pdfUrl?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  subscriptionId: string;
  userId: string;
  amount: number;
  status: string; // SUCCESS | FAILED | REFUNDED
  paymentMethod: string;
  refundedAmount?: number;
  createdAt: string;
}

export interface BillingEvent {
  id: string;
  subscriptionId: string;
  eventType: string;
  metadata: string;
  createdAt: string;
}

export interface Coupon {
  code: string;
  discountPercent?: number;
  discountAmount?: number;
  expiryDate?: string;
  active: boolean;
}

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const PLANS_FILE = path.join(DATA_DIR, 'billing_plans.json');
const SUBS_FILE = path.join(DATA_DIR, 'subscriptions.json');
const INVOICES_FILE = path.join(DATA_DIR, 'invoices.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');
const EVENTS_FILE = path.join(DATA_DIR, 'billing_events.json');
const COUPONS_FILE = path.join(DATA_DIR, 'coupons.json');

export class BillingStore {
  private static initFile(filePath: string, defaultData: any) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
    }
  }

  static getPlans(): BillingPlan[] {
    const defaultPlans: BillingPlan[] = [
      {
        id: 'basic',
        name: 'Basic Support',
        priceMonthly: 0,
        priceYearly: 0,
        features: ['DOCUMENTS', 'NOTIFICATIONS'],
        active: true
      },
      {
        id: 'premium',
        name: 'Premium Driver Pro',
        priceMonthly: 49,
        priceYearly: 490,
        features: ['DOCUMENTS', 'NOTIFICATIONS', 'AI_COPILOT', 'COMPLIANCE', 'SUPPORT_TICKETS'],
        active: true
      },
      {
        id: 'enterprise',
        name: 'Enterprise Team',
        priceMonthly: 99,
        priceYearly: 990,
        features: ['DOCUMENTS', 'NOTIFICATIONS', 'AI_COPILOT', 'COMPLIANCE', 'SUPPORT_TICKETS', 'FLEET_DISPATCH', 'VOICE_AGENT', 'WHATSAPP'],
        active: true
      }
    ];
    this.initFile(PLANS_FILE, defaultPlans);
    try {
      return JSON.parse(fs.readFileSync(PLANS_FILE, 'utf-8'));
    } catch {
      return defaultPlans;
    }
  }

  static savePlans(plans: BillingPlan[]) {
    fs.writeFileSync(PLANS_FILE, JSON.stringify(plans, null, 2), 'utf-8');
  }

  static getSubscriptions(): Subscription[] {
    this.initFile(SUBS_FILE, []);
    try {
      return JSON.parse(fs.readFileSync(SUBS_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }

  static saveSubscriptions(subs: Subscription[]) {
    fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
  }

  static getInvoices(): Invoice[] {
    this.initFile(INVOICES_FILE, []);
    try {
      return JSON.parse(fs.readFileSync(INVOICES_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }

  static saveInvoices(invoices: Invoice[]) {
    fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2), 'utf-8');
  }

  static getPayments(): Payment[] {
    this.initFile(PAYMENTS_FILE, []);
    try {
      return JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }

  static savePayments(payments: Payment[]) {
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(payments, null, 2), 'utf-8');
  }

  static getEvents(): BillingEvent[] {
    this.initFile(EVENTS_FILE, []);
    try {
      return JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }

  static saveEvents(events: BillingEvent[]) {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf-8');
  }

  static getCoupons(): Coupon[] {
    const defaultCoupons: Coupon[] = [
      { code: 'WELCOME10', discountPercent: 10, active: true },
      { code: 'SAVE50', discountAmount: 50, active: true }
    ];
    this.initFile(COUPONS_FILE, defaultCoupons);
    try {
      return JSON.parse(fs.readFileSync(COUPONS_FILE, 'utf-8'));
    } catch {
      return defaultCoupons;
    }
  }

  static saveCoupons(coupons: Coupon[]) {
    fs.writeFileSync(COUPONS_FILE, JSON.stringify(coupons, null, 2), 'utf-8');
  }
}
