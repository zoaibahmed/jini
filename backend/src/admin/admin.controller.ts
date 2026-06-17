import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import type { Request } from 'express';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // 1. Dashboard Aggregate statistics
  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  // 2. Users directory listing
  @Get('users')
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getUsers(search, role, status);
  }

  // 3. Driver full profile details
  @Get('users/:id')
  async getUserProfile(@Param('id') id: string) {
    return this.adminService.getUserProfile(id);
  }

  // 4. Suspend/Activate driver status
  @Patch('users/:id/status')
  async toggleUserStatus(
    @Req() req: any,
    @Param('id') userId: string,
    @Body() body: { isActive: boolean },
  ) {
    const adminId = req.user.id;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.adminService.updateUserStatus(adminId, userId, body.isActive, ip, userAgent);
  }

  // 5. Change user role permissions
  @Patch('users/:id/role')
  async changeUserRole(
    @Req() req: any,
    @Param('id') userId: string,
    @Body() body: { role: string },
  ) {
    const adminId = req.user.id;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.adminService.updateUserRole(adminId, userId, body.role, ip, userAgent);
  }

  // 6. Reset password override
  @Post('users/:id/reset-password')
  async forceResetPassword(
    @Req() req: any,
    @Param('id') userId: string,
    @Body() body: any,
  ) {
    const adminId = req.user.id;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.adminService.resetPassword(adminId, userId, body, ip, userAgent);
  }

  // 7. Manual billing refund
  @Post('payments/refund/:paymentId')
  async refundPayment(
    @Req() req: any,
    @Param('paymentId') paymentId: string,
  ) {
    const adminId = req.user.id;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.adminService.refundPayment(adminId, paymentId, ip, userAgent);
  }

  // 8. Banners Announcements
  @Get('announcements')
  async getAnnouncements() {
    return this.adminService.getAnnouncements();
  }

  @Post('announcements')
  async createAnnouncement(@Req() req: any, @Body() body: any) {
    const adminId = req.user.id;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.adminService.createAnnouncement(adminId, body, ip, userAgent);
  }

  // 9. Audits Logs
  @Get('logs')
  async getAuditLogs() {
    return this.adminService.getLogs();
  }

  // 10. Billing plans management
  @Get('plans')
  async getPlans() {
    return this.adminService.getPlans();
  }

  @Post('plans')
  async managePlan(@Req() req: any, @Body() body: any) {
    const adminId = req.user.id;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.adminService.managePlan(adminId, body, ip, userAgent);
  }

  // 11. Coupon management
  @Get('coupons')
  async getCoupons() {
    return this.adminService.getCoupons();
  }

  @Post('coupons')
  async createCoupon(@Req() req: any, @Body() body: any) {
    const adminId = req.user.id;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.adminService.createCoupon(adminId, body, ip, userAgent);
  }

  // 12. Payment transactions logs
  @Get('payments')
  async getPayments() {
    return this.adminService.getPayments();
  }

  // 13. Document Review Queue
  @Get('documents/review-queue')
  async getReviewQueue() {
    return this.adminService.getReviewQueue();
  }

  @Post('documents/:id/review')
  async processReview(
    @Req() req: any,
    @Param('id') docId: string,
    @Body() body: { action: 'ACCEPT' | 'REJECT' | 'UNSUPPORTED'; expiryDate?: string; categoryName?: string; adminNotes?: string },
  ) {
    const adminId = req.user.id;
    return this.adminService.processReview(adminId, docId, body);
  }
}
