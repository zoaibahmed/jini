import { Injectable, Logger, OnApplicationBootstrap, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { DocumentMetadataStore, DocumentMetadata } from '../document/document-metadata.store';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ComplianceCheckerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ComplianceCheckerService.name);
  private readonly idempotencyFilePath = path.join(process.cwd(), 'data', 'notification_idempotency.json');
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly whatsappService: WhatsappService,
  ) {}

  onApplicationBootstrap() {
    this.logger.log('ComplianceCheckerService initialized. Running initial audit...');
    // Run initial scan on startup
    this.runAudit().catch(err => {
      this.logger.error('Initial compliance audit failed:', err);
    });

    // Schedule to run every 24 hours (86400000 ms)
    this.intervalId = setInterval(() => {
      this.logger.log('Running scheduled daily compliance audit...');
      this.runAudit().catch(err => {
        this.logger.error('Scheduled daily compliance audit failed:', err);
      });
    }, 24 * 60 * 60 * 1000);
  }

  // Idempotency helper
  private isAlreadyNotified(userId: string, documentId: string, severity: string, dateStr: string): boolean {
    const key = `${userId}_${documentId}_${severity}_${dateStr}`;
    const keys = this.loadIdempotencyKeys();
    return keys.includes(key);
  }

  private markAsNotified(userId: string, documentId: string, severity: string, dateStr: string) {
    const key = `${userId}_${documentId}_${severity}_${dateStr}`;
    const keys = this.loadIdempotencyKeys();
    if (!keys.includes(key)) {
      keys.push(key);
      this.saveIdempotencyKeys(keys);
    }
  }

  private loadIdempotencyKeys(): string[] {
    try {
      const dir = path.dirname(this.idempotencyFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(this.idempotencyFilePath)) {
        fs.writeFileSync(this.idempotencyFilePath, JSON.stringify([]));
        return [];
      }
      const content = fs.readFileSync(this.idempotencyFilePath, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      this.logger.error('Failed to load notification idempotency file:', err);
      return [];
    }
  }

  private saveIdempotencyKeys(keys: string[]) {
    try {
      fs.writeFileSync(this.idempotencyFilePath, JSON.stringify(keys, null, 2), 'utf8');
    } catch (err) {
      this.logger.error('Failed to save notification idempotency file:', err);
    }
  }

  calculateSeverity(expiryDateStr: string | null): string {
    if (!expiryDateStr) return 'INFO';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const exp = new Date(expiryDateStr);
    if (isNaN(exp.getTime())) return 'INFO';
    const expDate = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
    const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return 'CRITICAL';
    if (daysLeft <= 14) return 'URGENT';
    if (daysLeft <= 30) return 'WARNING';
    if (daysLeft <= 90) return 'UPCOMING';
    return 'INFO';
  }

  async runAudit() {
    this.logger.log('Starting compliance audit scan...');
    const docs = DocumentMetadataStore.getAll();
    const todayStr = new Date().toISOString().split('T')[0];
    let updateCount = 0;
    let alertCount = 0;

    for (const doc of docs) {
      if (!doc.expiryDate) continue;

      const oldStatus = doc.status;
      const newStatus = this.calculateSeverity(doc.expiryDate);

      // Enforce the normalized name matching
      if (oldStatus !== newStatus) {
        doc.status = newStatus;
        DocumentMetadataStore.save(doc);
        updateCount++;
        this.logger.log(`Updated status of document ${doc.name} (${doc.id}) from ${oldStatus} to ${newStatus}`);
      }

      // If document status requires warning/alerting, check idempotency
      if (['WARNING', 'URGENT', 'CRITICAL'].includes(newStatus)) {
        if (this.isAlreadyNotified(doc.driverId, doc.id, newStatus, todayStr)) {
          this.logger.log(`Notification already sent today for doc ${doc.id} severity ${newStatus}. Skipping.`);
          continue;
        }

        // Fetch User information from database
        const user = await this.prisma.user.findUnique({
          where: { id: doc.driverId },
          select: { email: true, phone: true, name: true }
        });

        if (!user) {
          this.logger.warn(`User metadata not found for driver ID ${doc.driverId}`);
          continue;
        }

        const docFriendlyName = doc.categoryName.replace(/_/g, ' ');
        const notificationTitle = `Compliance Alert: ${docFriendlyName}`;
        const notificationMsg = `Your document "${docFriendlyName}" has a status of ${newStatus}. Expiry Date: ${doc.expiryDate}. Please renew it to stay compliant.`;

        // Send in-app notification & WebSocket update
        const mappedType = newStatus === 'WARNING' ? 'WARNING' : 'ERROR';
        await this.notificationService.createNotification(doc.driverId, notificationTitle, notificationMsg, mappedType);

        // Send Email for all WARNING, URGENT, CRITICAL
        if (user.email) {
          await this.emailService.sendRenewalReminder(user.email, {
            name: docFriendlyName,
            expiryDate: doc.expiryDate
          }).catch(err => this.logger.error(`Failed to send email to ${user.email}:`, err));
        }

        // Send SMS & WhatsApp for URGENT and CRITICAL
        if (['URGENT', 'CRITICAL'].includes(newStatus) && user.phone) {
          const smsMsg = `JNI Alert: Your ${docFriendlyName} expires on ${doc.expiryDate}. Status: ${newStatus}. Renew now: https://jnisolutionsllc.com`;
          await this.smsService.sendSms(user.phone, smsMsg, 'RENEWAL_REMINDER').catch(err =>
            this.logger.error(`Failed to send SMS to ${user.phone}:`, err)
          );

          await this.whatsappService.sendWhatsAppMessage(user.phone, smsMsg).catch(err =>
            this.logger.error(`Failed to send WhatsApp message to ${user.phone}:`, err)
          );
        }

        // Admin flag for CRITICAL status
        if (newStatus === 'CRITICAL') {
          const adminTitle = `Critical Compliance: ${user.name}`;
          const adminMsg = `Driver ${user.name} has an expired ${docFriendlyName} (Expired on ${doc.expiryDate}).`;
          await this.notificationService.createAdminNotification(adminTitle, adminMsg, 'ERROR').catch(err =>
            this.logger.error(`Failed to send admin notification:`, err)
          );
        }

        // Mark as notified today
        this.markAsNotified(doc.driverId, doc.id, newStatus, todayStr);
        alertCount++;
      }
    }

    this.logger.log(`Compliance audit scan finished. Updated ${updateCount} documents. Dispatched ${alertCount} alerts.`);
    return { success: true, updated: updateCount, alertsSent: alertCount };
  }
}
