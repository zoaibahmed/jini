import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  // 1. Get Administrative Dashboard Statistics
  async getDashboardStats() {
    const totalDrivers = await this.prisma.user.count({
      where: { role: UserRole.DRIVER },
    });

    const activeUsers = await this.prisma.userSession.count({
      where: { isValid: true, expiresAt: { gt: new Date() } },
    });

    const sumPayments = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS' },
    });
    const totalRevenue = sumPayments._sum.amount || 0.0;

    const totalTickets = await this.prisma.ticket.count();
    const openTickets = await this.prisma.ticket.count({
      where: { status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ESCALATED'] } },
    });

    const totalAiUsage = await this.prisma.aIUsage.count();
    const totalCalls = await this.prisma.voiceCall.count();

    const pendingRenewals = await this.prisma.complianceCheck.count({
      where: { status: 'PENDING' },
    });

    const totalDocuments = await this.prisma.document.count();

    // Chart Growth (Seeded simulated summaries)
    const monthlyGrowth = [
      { month: 'Jan', drivers: 250, revenue: 8400 },
      { month: 'Feb', drivers: 380, revenue: 12500 },
      { month: 'Mar', drivers: 590, revenue: 19800 },
      { month: 'Apr', drivers: 840, revenue: 27900 },
      { month: 'May', drivers: totalDrivers, revenue: totalRevenue },
    ];

    return {
      stats: {
        totalDrivers,
        activeUsers,
        totalRevenue,
        openTickets,
        totalTickets,
        totalAiUsage,
        totalCalls,
        pendingRenewals,
        totalDocuments,
      },
      growth: monthlyGrowth,
    };
  }

  // 2. Fetch User Directory List
  async getUsers(search?: string, role?: string, status?: string) {
    const where: any = {};

    if (role) {
      where.role = role.toUpperCase() as UserRole;
    }
    if (status) {
      where.isActive = status === 'active';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. Get User Admin Profile View
  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        driverProfile: true,
        vehicles: true,
        documents: true,
        subscription: { include: { plan: true } },
        driverTickets: { orderBy: { createdAt: 'desc' } },
        aiChats: {
          orderBy: { updatedAt: 'desc' },
          include: { messages: { take: 10 } },
        },
      },
    });

    if (!user) throw new NotFoundException('User profile not found');
    
    // Fetch associated voice calls
    const voiceCalls = await this.prisma.voiceCall.findMany({
      where: { caller: user.phone || 'N/A' },
      orderBy: { createdAt: 'desc' },
    });

    return { ...user, voiceCalls };
  }

  // 4. Suspend/Activate User Account
  async updateUserStatus(adminId: string, userId: string, isActive: boolean, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    await this.prisma.adminLog.create({
      data: {
        userId: adminId,
        action: isActive ? 'USER_ACTIVATE' : 'USER_SUSPEND',
        targetId: userId,
        details: `Account status updated to ${isActive ? 'ACTIVE' : 'SUSPENDED'}`,
        ip,
        userAgent,
      },
    });

    return user;
  }

  // 5. Update User Role Assignment
  async updateUserRole(adminId: string, userId: string, role: string, ip?: string, userAgent?: string) {
    const roleEnum = role.toUpperCase() as UserRole;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: roleEnum },
    });

    await this.prisma.adminLog.create({
      data: {
        userId: adminId,
        action: 'ROLE_CHANGE',
        targetId: userId,
        details: `Role updated to ${roleEnum}`,
        ip,
        userAgent,
      },
    });

    return user;
  }

  // 6. Force Reset Password
  async resetPassword(adminId: string, userId: string, data: any, ip?: string, userAgent?: string) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await this.prisma.adminLog.create({
      data: {
        userId: adminId,
        action: 'PASSWORD_RESET',
        targetId: userId,
        details: 'Forced administrative password override',
        ip,
        userAgent,
      },
    });

    return { success: true, message: 'Password override completed successfully.' };
  }

  // 7. Manual Billing Refund
  async refundPayment(adminId: string, paymentId: string, ip?: string, userAgent?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment record not found');

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED', refundedAmount: payment.amount },
    });

    await this.prisma.adminLog.create({
      data: {
        userId: adminId,
        action: 'REFUND_PAYMENT',
        targetId: paymentId,
        details: `Refunded manual amount $${payment.amount}`,
        ip,
        userAgent,
      },
    });

    return updatedPayment;
  }

  // 8. Announcement Banners Management
  async getAnnouncements() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAnnouncement(adminId: string, data: any, ip?: string, userAgent?: string) {
    const announcement = await this.prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type || 'MAINTENANCE',
        isActive: data.isActive !== undefined ? data.isActive : true,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      },
    });

    await this.prisma.adminLog.create({
      data: {
        userId: adminId,
        action: 'ANNOUNCEMENT_CREATE',
        targetId: announcement.id,
        details: `Broadcast banner created: "${data.title}"`,
        ip,
        userAgent,
      },
    });

    return announcement;
  }

  // 9. System & Operational Audit Logs
  async getLogs() {
    const adminLogs = await this.prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { name: true, email: true, role: true } } },
    });

    const systemEvents = await this.prisma.systemEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return { adminLogs, systemEvents };
  }

  // 10. Billing plans management
  async getPlans() {
    return this.prisma.billingPlan.findMany({
      orderBy: { priceMonthly: 'asc' },
    });
  }

  async managePlan(adminId: string, data: any, ip?: string, userAgent?: string) {
    let plan;
    if (data.id) {
      plan = await this.prisma.billingPlan.update({
        where: { id: data.id },
        data: {
          name: data.name,
          priceMonthly: parseFloat(data.priceMonthly),
          priceYearly: parseFloat(data.priceYearly),
          features: data.features,
          active: data.active ?? true,
          trialDays: parseInt(data.trialDays || 0),
        },
      });
    } else {
      plan = await this.prisma.billingPlan.create({
        data: {
          name: data.name,
          priceMonthly: parseFloat(data.priceMonthly),
          priceYearly: parseFloat(data.priceYearly),
          features: data.features,
          trialDays: parseInt(data.trialDays || 0),
        },
      });
    }

    await this.prisma.adminLog.create({
      data: {
        userId: adminId,
        action: 'PLAN_UPDATE',
        targetId: plan.id,
        details: `Billing plan "${plan.name}" updated/created. Price: $${plan.priceMonthly}/mo`,
        ip,
        userAgent,
      },
    });

    return plan;
  }

  // 11. Coupon promotion management
  async getCoupons() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCoupon(adminId: string, data: any, ip?: string, userAgent?: string) {
    const coupon = await this.prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        discountPercent: data.discountPercent ? parseInt(data.discountPercent) : null,
        discountAmount: data.discountAmount ? parseFloat(data.discountAmount) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      },
    });

    await this.prisma.adminLog.create({
      data: {
        userId: adminId,
        action: 'COUPON_CREATE',
        targetId: coupon.id,
        details: `Promo coupon code created: "${coupon.code}"`,
        ip,
        userAgent,
      },
    });

    return coupon;
  }

  // 12. Payment transactions
  async getPayments() {
    return this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            plan: true,
          },
        },
      },
    });
  }
}
