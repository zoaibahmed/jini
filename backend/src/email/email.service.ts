import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Queues } from '../workers/worker.config';

@Injectable()
export class EmailService {
  constructor(private readonly prisma: PrismaService) {}

  async queueEmail(to: string, subject: string, body: string, type: string) {
    const user = await this.prisma.user.findUnique({ where: { email: to } });
    let logId: string | undefined;

    if (user) {
      const notification = await this.prisma.notification.create({
        data: {
          userId: user.id,
          title: subject,
          message: body,
          body: body,
          type: 'INFO',
          channel: 'EMAIL',
          status: 'PENDING',
        },
      });
      logId = notification.id;
    }

    // Queue job through BullMQ
    await Queues.emails.add(
      type,
      { to, subject, body, type, logId, userId: user?.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
    );

    return {
      id: logId || Math.random().toString(36).substring(2, 9),
      recipient: to,
      subject,
      status: 'PENDING',
      type
    };
  }

  async getEmailLogs() {
    return this.prisma.notification.findMany({
      where: { channel: 'EMAIL' },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Convenience methods for specific email templates
  async sendWelcomeEmail(to: string, name: string) {
    const subject = 'Welcome to JNI Solutions!';
    const body = `Hi ${name},\n\nWelcome to JNI Solutions, your premier TLC Driver Support, Compliance, and Renewal platform. We are thrilled to help you manage your credentials, book appointments, and stay compliant!\n\nBest regards,\nThe JNI Solutions Team`;
    return this.queueEmail(to, subject, body, 'WELCOME');
  }

  async sendVerificationEmail(to: string, token: string) {
    const subject = 'Verify Your Email - JNI Solutions';
    const body = `Please verify your email address by using the following code/token:\n\n${token}\n\nThis token will expire shortly.`;
    return this.queueEmail(to, subject, body, 'VERIFICATION');
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const subject = 'Password Reset Request - JNI Solutions';
    const body = `You are receiving this email because you requested a password reset. Please use the following code/token to reset your password:\n\n${token}\n\nIf you did not request this, please ignore this email.`;
    return this.queueEmail(to, subject, body, 'RESET');
  }

  async sendAppointmentConfirmation(to: string, appointmentDetails: { title: string; time: string }) {
    const subject = 'Appointment Confirmed - JNI Solutions';
    const body = `Your appointment for "${appointmentDetails.title}" has been successfully scheduled for ${appointmentDetails.time}.\n\nIf you need to reschedule, please visit your JNI dashboard.`;
    return this.queueEmail(to, subject, body, 'APPOINTMENT_CONF');
  }

  async sendAppointmentReminder(to: string, appointmentDetails: { title: string; time: string }) {
    const subject = 'Appointment Reminder - JNI Solutions';
    const body = `This is a reminder that you have an upcoming appointment for "${appointmentDetails.title}" scheduled for ${appointmentDetails.time}.\n\nWe look forward to seeing you.`;
    return this.queueEmail(to, subject, body, 'APPOINTMENT_REM');
  }

  async sendRenewalReminder(to: string, item: { name: string; expiryDate: string }) {
    const subject = `Renewal Alert: ${item.name} Expiring Soon`;
    const body = `This is a friendly reminder that your document "${item.name}" is expiring on ${item.expiryDate}.\n\nPlease renew it or upload the updated copy in the JNI Document Vault to remain compliant.`;
    return this.queueEmail(to, subject, body, 'RENEWAL_REM');
  }

  async sendBillingReceipt(to: string, invoiceDetails: { id: string; amount: number }) {
    const subject = 'Receipt for Your JNI Solutions Subscription';
    const body = `Thank you for your payment! Here is your receipt for invoice #${invoiceDetails.id}.\n\nAmount paid: $${invoiceDetails.amount.toFixed(2)}\n\nYour subscription is active.`;
    return this.queueEmail(to, subject, body, 'RECEIPT');
  }

  async sendSupportTicketUpdate(to: string, ticketDetails: { id: string; title: string; message: string }) {
    const subject = `Support Ticket Update: [${ticketDetails.id}] ${ticketDetails.title}`;
    const body = `Your support ticket has a new reply:\n\n---\n${ticketDetails.message}\n---\n\nYou can view the ticket history and reply on your JNI Support Dashboard.`;
    return this.queueEmail(to, subject, body, 'TICKET_UPD');
  }
}
