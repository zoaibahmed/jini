import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
  ) {}

  async createNotification(userId: string, title: string, message: string, type: string) {
    this.logger.log(`Creating notification for user ${userId}: ${title}`);
    
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        body: message, // compatibility
        type: ['INFO', 'WARNING', 'SUCCESS', 'ERROR'].includes(type) ? type : 'INFO',
        channel: ['EMAIL', 'SMS', 'WHATSAPP', 'VOICE', 'IN_APP'].includes(type) ? type : 'IN_APP',
        status: 'PENDING',
      },
    });

    // Send real-time Socket.io push
    try {
      this.gateway.sendNotification(userId, notification);
    } catch (err: any) {
      this.logger.error(`WebSocket emit failed: ${err.message}`);
    }

    return notification;
  }

  async createAdminNotification(title: string, message: string, type: string) {
    this.logger.log(`Creating admin notification: ${title}`);
    
    // Find all users with admin or superadmin roles
    const admins = await this.prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPERADMIN'],
        },
      },
    });

    const notifications: any[] = [];
    for (const admin of admins) {
      const notification = await this.prisma.notification.create({
        data: {
          userId: admin.id,
          title,
          message,
          body: message,
          type: ['INFO', 'WARNING', 'SUCCESS', 'ERROR'].includes(type) ? type : 'INFO',
          channel: ['EMAIL', 'SMS', 'WHATSAPP', 'VOICE', 'IN_APP'].includes(type) ? type : 'IN_APP',
          status: 'SENT',
        },
      });
      notifications.push(notification);

      try {
        this.gateway.sendNotification(admin.id, notification);
      } catch (err: any) {
        this.logger.error(`WebSocket emit failed for admin ${admin.id}: ${err.message}`);
      }
    }

    // Also push to generic 'admins' socket room
    try {
      if (notifications.length > 0) {
        this.gateway.sendAdminNotification(notifications[0]);
      }
    } catch (err: any) {
      this.logger.error(`WebSocket emit failed for admin room: ${err.message}`);
    }

    return notifications;
  }

  async getNotificationsForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId },
      data: {
        readAt: new Date(),
      },
    });
  }

  async deleteNotification(notificationId: string) {
    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }
}
